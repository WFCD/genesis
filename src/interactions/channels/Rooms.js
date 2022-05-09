import Discord from 'discord.js';
import { games, isVulgarCheck } from '../../utilities/CommonFunctions.js';
import Interaction from '../../models/Interaction.js';
import { cmds } from '../../resources/index.js';
import logger from '../../utilities/Logger.js';

const {
  Constants: { ApplicationCommandOptionTypes: Types },
  Permissions,
  MessageEmbed,
} = Discord;

const GuildChannelOverwriteOptionsType = {
  ROLE: 0,
  MEMBER: 1,
};

const getMentions = (content, guild) =>
  content
    .trim()
    .replace(/[<>!@]/gi, ' ')
    .split(' ')
    .filter((id) => id)
    .map((id) => guild.members.cache.get(id));

/**
 * Make guild overwrites for a new room
 * @param {Guild} guild guild to make overwrites for
 * @param {RoomOption} options options for context generating permission overwrites
 * @returns {*[]}
 */
const makeOverwrites = (guild, options) => {
  const overwrites = [];
  if (options.isPublic) {
    const everyoneOverwrites = [];
    everyoneOverwrites.push(Permissions.FLAGS.CONNECT);
    if (!options.shown) everyoneOverwrites.push(Permissions.FLAGS.VIEW_CHANNEL);
    overwrites.push({
      id: guild.roles.everyone.id,
      deny: everyoneOverwrites,
      type: 'role',
    });
    options.invites.forEach((user) => {
      overwrites.push({
        id: user.id,
        allow: [
          Permissions.FLAGS.VIEW_CHANNEL,
          Permissions.FLAGS.SEND_MESSAGES,
          Permissions.FLAGS.CONNECT,
          Permissions.FLAGS.SPEAK,
          Permissions.FLAGS.USE_VAD,
        ],
        type: 'user',
      });
    });
  } else {
    overwrites.push({
      id: guild.roles.everyone.id,
      allow: [Permissions.FLAGS.VIEW_CHANNEL, Permissions.FLAGS.CONNECT],
    });
  }
  overwrites.push(
    {
      allow: [
        Permissions.FLAGS.VIEW_CHANNEL,
        Permissions.FLAGS.SEND_MESSAGES,
        Permissions.FLAGS.CONNECT,
        Permissions.FLAGS.MUTE_MEMBERS,
        Permissions.FLAGS.DEAFEN_MEMBERS,
        Permissions.FLAGS.MOVE_MEMBERS,
        Permissions.FLAGS.MANAGE_ROLES,
        Permissions.FLAGS.MANAGE_CHANNELS,
      ],
      id: guild.me.id,
      type: 'user',
    },
    {
      id: options.author.id,
      allow: [
        Permissions.FLAGS.VIEW_CHANNEL,
        Permissions.FLAGS.SEND_MESSAGES,
        Permissions.FLAGS.CONNECT,
        Permissions.FLAGS.SPEAK,
        Permissions.FLAGS.USE_VAD,
        Permissions.FLAGS.MANAGE_MESSAGES,
      ],
      type: 'user',
    }
  );
  if (options.modRole) {
    overwrites.push({
      id: options?.modRole?.id,
      allow: [
        Permissions.FLAGS.VIEW_CHANNEL,
        Permissions.FLAGS.SEND_MESSAGES,
        Permissions.FLAGS.CONNECT,
        Permissions.FLAGS.SPEAK,
        Permissions.FLAGS.USE_VAD,
        Permissions.FLAGS.MANAGE_MESSAGES,
        Permissions.FLAGS.DEAFEN_MEMBERS,
        Permissions.FLAGS.MOVE_MEMBERS,
      ],
      type: 'role',
    });
  }
  return overwrites;
};

/**
 * @type {Discord.PermissionOverwriteOptions}
 */
const invitedOverwrite = {
  VIEW_CHANNEL: true,
  SEND_MESSAGES: true,
  CONNECT: true,
  SPEAK: true,
  USE_VAD: true,
  MANAGE_CHANNELS: false,
};

const blockOverwrite = {
  VIEW_CHANNEL: false,
  SEND_MESSAGES: false,
  CONNECT: false,
  SPEAK: false,
  USE_VAD: false,
};

/**
 *
 * @param {Guild} guild guild to create channel in
 * @param {RoomOption} options options provided by user to populate
 * @returns {Promise<string|MessageEmbed>}
 */
const create = async (guild, options) => {
  if (options.userHasRoom) {
    return 'You already have a private room registered.';
  }
  if (guild.channels.cache.find((channel) => channel.name === options.name)) {
    return `There already exists a channel with the name \`${options.name}\``;
  }
  const overwrites = makeOverwrites(guild, options);
  const cleanedName = options.name.replace(/[^\w|-]/gi, '');
  const category =
    options.category ||
    (await guild.channels.create(options.name, {
      name: options.name,
      type: 'GUILD_CATEGORY',
      permissionOverwrites: overwrites,
    }));
  let textChannel =
    options.useText && !options.category
      ? await guild.channels.create(cleanedName, {
          name: cleanedName,
          type: 'GUILD_TEXT',
          parent: category.id,
          permissionOverwrites: overwrites,
        })
      : undefined;
  if (!textChannel && options.channel && options.useText) {
    textChannel = await options.channel.threads.create({ name: options.name });
  }
  const voiceChannel = await guild.channels.create(options.name, {
    name: options.name,
    type: 'GUILD_VOICE',
    parent: category,
    permissionOverwrites: overwrites,
    userLimit: typeof options.limit !== 'undefined' ? options.limit : undefined,
  });

  await options.settings.addPrivateRoom(
    guild,
    textChannel,
    voiceChannel,
    category === options.category ? { id: 0 } : category,
    options.author
  );
  // send invites
  if (voiceChannel.permissionsFor(guild.me).has(Permissions.FLAGS.CREATE_INSTANT_INVITE)) {
    await Promise.all(
      options.invites.map(async (user) => {
        await user.createDM().then((dmChannel) =>
          dmChannel.send({
            content: `You've been invited to <#${voiceChannel.id}> by ${options.author}`,
            allowedMentions: {
              users: [],
            },
          })
        );
      })
    );
  }
  return new MessageEmbed({
    title: 'Channels created',
    fields: [
      {
        name: '\u200B',
        value: `Voice Channel: ${voiceChannel}${textChannel ? `\nText Channel: ${textChannel}` : ''}`,
      },
    ],
  });
};

const roomSizes = [
  {
    name: 'Room (∞)',
    value: 0,
  },
  {
    name: 'Raid (8)',
    value: 8,
  },
  {
    name: 'Team (4)',
    value: 4,
  },
  {
    name: 'Chat (∞)',
    value: 0,
  },
];

export default class Rooms extends Interaction {
  static enabled = games.includes('ROOMS');
  static #logger = logger;
  static command = {
    ...cmds.rooms,
    options: [
      {
        ...cmds['rooms.create'],
        type: Types.SUB_COMMAND,
        options: [
          {
            name: 'type',
            type: Types.NUMBER,
            description: 'What kind of room should this be?',
            required: true,
            choices: roomSizes,
          },
          {
            name: 'locked',
            type: Types.BOOLEAN,
            description: 'Should this channel be locked on creation?',
          },
          {
            name: 'text',
            type: Types.BOOLEAN,
            description: 'Should we make a text channel too?',
          },
          {
            name: 'shown',
            type: Types.BOOLEAN,
            description: 'Should this channel be visible to everyone?',
          },
          {
            name: 'name',
            type: Types.STRING,
            description: 'What should the channel you create be called?',
          },
          {
            name: 'invites',
            type: Types.STRING,
            description: 'Who do you want to have access',
          },
        ],
      },
      {
        ...cmds['rooms.destroy'],
        type: Types.SUB_COMMAND,
      },
      {
        ...cmds['rooms.hide'],
        type: Types.SUB_COMMAND,
      },
      {
        ...cmds['rooms.show'],
        type: Types.SUB_COMMAND,
      },
      {
        ...cmds['rooms.lock'],
        type: Types.SUB_COMMAND,
      },
      {
        ...cmds['rooms.unlock'],
        type: Types.SUB_COMMAND,
      },
      {
        ...cmds['rooms.lurkable'],
        type: Types.SUB_COMMAND,
      },
      {
        ...cmds['rooms.rename'],
        type: Types.SUB_COMMAND,
        options: [
          {
            name: 'name',
            type: Types.STRING,
            description: 'What do you want to rename your room to?',
            required: true,
          },
        ],
      },
      {
        ...cmds['rooms.invite'],
        type: Types.SUB_COMMAND,
        options: [
          {
            name: 'invite',
            type: Types.USER,
            description: 'Who do you want to add to your channel?',
            required: true,
          },
        ],
      },
      {
        ...cmds['rooms.block'],
        type: Types.SUB_COMMAND,
        options: [
          {
            name: 'invite',
            type: Types.USER,
            description: 'Who do you want to block from your channel?',
            required: true,
          },
        ],
      },
      {
        ...cmds['rooms.resize'],
        type: Types.SUB_COMMAND,
        options: [
          {
            name: 'type',
            type: Types.NUMBER,
            description: 'What kind of room should this be?',
            required: true,
            choices: roomSizes,
          },
        ],
      },
    ],
  };

  static async commandHandler(interaction, ctx) {
    const subcommand = interaction.options.getSubcommand();
    /**
     * Rooms options object
     * @typedef {Object} RoomOption
     * @property {User} author
     * @property {number} limit
     * @property {boolean} isPublic
     * @property {boolean} useText
     * @property {boolean} shown
     * @property {string} name
     * @property {Array<Discord.GuildMember>} invites
     * @property {Discord.User} invite
     * @property {Role} modRole
     * @property {boolean} userHasRoom
     * @property {Room} room
     * @property {Database} settings
     * @property {Discord.CategoryChannel} category
     * @property {Discord.TextChannel} channel
     */
    const options = {
      author: interaction.user,
      limit: interaction.options.getNumber('type') || 0,
      isPublic: interaction.options?.getBoolean?.('locked') || undefined,
      useText: interaction.options?.getBoolean?.('text') || undefined,
      shown: interaction.options?.getBoolean?.('shown') || undefined,
      name: (interaction.options?.getString?.('name') || `room-${interaction.member.displayName}`.toLowerCase())
        .replace(isVulgarCheck, '')
        .trim(),
      invites: getMentions(interaction.options?.getString?.('invites') || '', interaction.guild),
      invite: interaction?.options?.getUser?.('invite'),
      modRole: ctx.modRole,
      userHasRoom: await ctx.settings.userHasRoom(interaction.member),
      category: ctx.tempCategory,
      channel: ctx.tempChannel,
      settings: ctx.settings,
    };
    options.room = await ctx.settings.getUsersRoom(interaction.member);
    options.isPublic = typeof options.isPublic === 'undefined' ? !ctx.defaultRoomsLocked : options.isPublic;
    const alwaysText = options.category ? false : options.useText;
    options.useText = typeof options.useText === 'undefined' ? !ctx.defaultNoText : alwaysText;
    options.shown = typeof options.shown === 'undefined' ? ctx.defaultShown : options.shown;
    const { everyone } = interaction.guild.roles;

    let show = options?.room?.voiceChannel?.permissionsFor(everyone).has(Permissions.FLAGS.VIEW_CHANNEL);
    let connect = options?.room?.voiceChannel?.permissionsFor(everyone)?.has(Permissions.FLAGS.CONNECT);
    if (
      options?.category &&
      !options.category
        .permissionsFor(interaction.client.user.id)
        .has([Permissions.FLAGS.MANAGE_CHANNELS, Permissions.FLAGS.MANAGE_GUILD])
    ) {
      return interaction.reply({ content: 'Bot missing manage channels perms', ephemeral: ctx.ephemerate });
    }
    await interaction.deferReply({ ephemeral: ctx.ephemerate });
    try {
      switch (subcommand) {
        case 'create':
          if (!ctx.createPrivateChannel)
            return interaction.editReply({ content: 'feature not enabled', ephemeral: true });
          // eslint-disable-next-line no-case-declarations
          const msg = await create(interaction.guild, options);
          return typeof msg === 'string'
            ? interaction.editReply({ content: msg, ephemeral: ctx.ephemerate })
            : interaction.editReply({ embeds: [msg], ephemeral: ctx.ephemerate });
        case 'destroy':
          if (options.userHasRoom) {
            const { room } = options;
            if (room?.textChannel?.deletable) await room.textChannel.delete();
            if (room?.voiceChannel?.deletable) await room.voiceChannel.delete();
            if (room?.category?.deletable && room.category.id !== options.category.id) {
              await room.category.delete();
            }
            await ctx.settings.deletePrivateRoom(room);
            return interaction.editReply({ content: 'Private room deleted', ephemeral: ctx.ephemerate });
          }
          return interaction.editReply({ content: 'Nothing to destroy', ephemeral: ctx.ephemerate });
        case 'hide':
          show = false;
          return this.#roomUpdate(options, connect, show, interaction, ctx);
        case 'show':
          show = true;
          return this.#roomUpdate(options, connect, show, interaction, ctx);
        case 'lock':
          connect = false;
          return this.#roomUpdate(options, connect, show, interaction, ctx);
        case 'unlock':
          connect = true;
          return this.#roomUpdate(options, connect, show, interaction, ctx);
        case 'lurkable':
          if (options.userHasRoom) {
            const { room } = options;
            /**
             * @type {Discord.PermissionOverwriteOptions}
             */
            const overwrite = {
              CONNECT: true,
              VIEW_CHANNEL: true,
              SPEAK: false,
              SEND_MESSAGES: false,
            };
            /**
             * Audit log options
             * @type {Discord.GuildChannelOverwriteOptions}
             */
            const audit = {
              reason: `Room updated by ${interaction.user.tag}`,
              type: GuildChannelOverwriteOptionsType.MEMBER,
            };
            await this.#assignRoomOverwrites(room, overwrite, audit);
            return interaction.editReply({ content: 'Private room updated', ephemeral: ctx.ephemerate });
          }
          return interaction.editReply({ content: 'Nothing to update', ephemeral: ctx.ephemerate });
        case 'rename':
          if (options.userHasRoom && options.name) {
            if (options.room?.textChannel?.manageable) {
              await options.room.textChannel.setName(
                options.name.replace(/\s/gi, '-'),
                `New name for ${options.room.textChannel}.`
              );
            }
            if (options.room?.voiceChannel) {
              await options.room.voiceChannel.setName(options.name, `New name for ${options.room.voiceChannel}.`);
            }
            if (options.room?.category) {
              await options.room.category.setName(options.name, `New name for ${options.room.category}.`);
            }
            return interaction.editReply({ content: 'Done', ephemeral: ctx.ephemerate });
          }
          return interaction.editReply({ content: 'Nothing to rename', ephemeral: ctx.ephemerate });
        case 'resize':
          if (options.userHasRoom && typeof options.limit !== 'undefined' && options.room.voiceChannel.manageable) {
            await options.room.voiceChannel.setUserLimit(options.limit);
            return interaction.editReply({ content: 'Voice channel resized', ephemeral: ctx.ephemerate });
          }
          return interaction.editReply({ content: "Couldn't resize nothingness!", ephemeral: ctx.ephemerate });
        case 'invite':
          if (options.userHasRoom && options.invite) {
            const { room, invite } = options;
            const audit = {
              reason: `${invite.tag} invited to room by ${interaction.user.tag}`,
              type: GuildChannelOverwriteOptionsType.MEMBER,
            };
            await this.#assignRoomOverwrites(room, invitedOverwrite, audit, invite);
            return interaction.editReply({ content: `invited ${invite}`, ephemeral: ctx.ephemerate });
          }
          return interaction.editReply({
            content: "Couldn't invite someone to nothingness!",
            ephemeral: ctx.ephemerate,
          });
        case 'block':
          if (options.userHasRoom && options.invite) {
            const { room, invite } = options;
            const audit = {
              reason: `${invite.tag} blocked from room by ${interaction.user.tag}`,
              type: GuildChannelOverwriteOptionsType.MEMBER,
            };
            await this.#assignRoomOverwrites(room, blockOverwrite, audit, invite);
            return interaction.editReply({ content: `blocked ${invite}`, ephemeral: ctx.ephemerate });
          }
          return interaction.editReply({
            content: "Couldn't invite someone to nothingness!",
            ephemeral: ctx.ephemerate,
          });
        default:
          break;
      }
    } catch (e) {
      this.#logger.error(e);
      return interaction.editReply('unable to act');
    }

    return interaction.editReply({ content: ctx.i18n`naaah`, ephemeral: ctx.ephemerate });
  }

  static async #roomUpdate(options, connect, show, interaction, ctx) {
    if (options.userHasRoom) {
      const { room } = options;
      /**
       * @type {Discord.PermissionOverwriteOptions}
       */
      const overwrite = {
        CONNECT: connect,
        VIEW_CHANNEL: show,
      };
      /**
       * Audit log options
       * @type {Discord.GuildChannelOverwriteOptions}
       */
      const audit = {
        reason: `Room updated by ${interaction.user.tag}`,
        type: GuildChannelOverwriteOptionsType.MEMBER,
      };
      try {
        await this.#assignRoomOverwrites(room, overwrite, audit);
      } catch (e) {
        this.#logger.error(e);
        return interaction.editReply({ content: "Couldn't update permissions", ephemeral: true });
      }
      return interaction.editReply({ content: 'Private room updated', ephemeral: ctx.ephemerate });
    }
    return interaction.editReply({ content: 'Nothing to update', ephemeral: ctx.ephemerate });
  }

  /**
   * Set room overwrites
   * @param {Room} room room to apply changes to
   * @param {Discord.PermissionOverwriteOptions} overwrite permissions overwrite to apply
   * @param {Discord.GuildChannelOverwriteOptions} audit audit log message
   * @param {Discord.User} [user] optional user
   * @returns {Promise<*>}
   */
  static async #assignRoomOverwrites(room, overwrite, audit, user) {
    const {
      /** @type {Discord.Guild} */
      guild,
      /** @type {Discord.TextChannel} */
      textChannel,
      /** @type {Discord.VoiceChannel} */
      voiceChannel,
      /** @type {Discord.CategoryChannel} */
      category,
    } = room;
    const everyone = guild.roles.everyone.id;
    if (textChannel?.manageable) {
      await room.textChannel.permissionOverwrites.edit(user || everyone, overwrite, audit);
    }
    if (voiceChannel?.manageable) {
      await voiceChannel.permissionOverwrites.edit(user || everyone, overwrite, audit);
    }
    if (category?.manageable) {
      await category.permissionOverwrites.edit(user || everyone, overwrite, audit);
    }
  }
}
