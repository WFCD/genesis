import { PermissionsBitField, EmbedBuilder, ApplicationCommandOptionType } from 'discord.js';

import { games, isVulgarCheck } from '../../utilities/CommonFunctions.js';
import Interaction from '../../models/Interaction.js';
import { cmds } from '../../resources/index.js';
import logger from '../../utilities/Logger.js';

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
    everyoneOverwrites.push(PermissionsBitField.Flags.Connect);
    if (!options.shown) everyoneOverwrites.push(PermissionsBitField.Flags.ViewChannel);
    overwrites.push({
      id: guild.roles.everyone.id,
      deny: everyoneOverwrites,
      type: 'role',
    });
    options.invites.forEach((user) => {
      overwrites.push({
        id: user.id,
        allow: [
          PermissionsBitField.Flags.ViewChannel,
          PermissionsBitField.Flags.SendMessages,
          PermissionsBitField.Flags.Connect,
          PermissionsBitField.Flags.Speak,
          PermissionsBitField.Flags.UseVAD,
        ],
        type: 'user',
      });
    });
  } else {
    overwrites.push({
      id: guild.roles.everyone.id,
      allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.Connect],
    });
  }
  overwrites.push(
    {
      allow: [
        PermissionsBitField.Flags.ViewChannel,
        PermissionsBitField.Flags.SendMessages,
        PermissionsBitField.Flags.CONNECT,
        PermissionsBitField.Flags.MuteMembers,
        PermissionsBitField.Flags.DeafenMembers,
        PermissionsBitField.Flags.MoveMembers,
        PermissionsBitField.Flags.ManageRoles,
        PermissionsBitField.Flags.ManageChannels,
      ],
      id: guild.me.id,
      type: 'user',
    },
    {
      id: options.author.id,
      allow: [
        PermissionsBitField.Flags.ViewChannel,
        PermissionsBitField.Flags.SendMessages,
        PermissionsBitField.Flags.Connect,
        PermissionsBitField.Flags.Speak,
        PermissionsBitField.Flags.UseVAD,
        PermissionsBitField.Flags.ManageMessages,
      ],
      type: 'user',
    }
  );
  if (options.modRole) {
    overwrites.push({
      id: options?.modRole?.id,
      allow: [
        PermissionsBitField.Flags.ViewChannel,
        PermissionsBitField.Flags.SendMessages,
        PermissionsBitField.Flags.Connect,
        PermissionsBitField.Flags.Speak,
        PermissionsBitField.Flags.UseVAD,
        PermissionsBitField.Flags.ManageMessages,
        PermissionsBitField.Flags.DeafenMembers,
        PermissionsBitField.Flags.MoveMembers,
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
  ViewChannel: true,
  SendMessages: true,
  Connect: true,
  Speak: true,
  UseVAD: true,
  ManageChannels: false,
};

/**
 * @type {Discord.PermissionOverwriteOptions}
 */
const blockOverwrite = {
  ViewChannel: false,
  SendMessages: false,
  Connect: false,
  Speak: false,
  UseVAD: false,
};

/**
 *
 * @param {Guild} guild guild to create channel in
 * @param {RoomOption} options options provided by user to populate
 * @returns {Promise<string|EmbedBuilder>}
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
  if (voiceChannel.permissionsFor(guild.me).has(PermissionsBitField.Flags.CreateInstantInvite)) {
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
  return new EmbedBuilder({
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
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'type',
            type: ApplicationCommandOptionType.Number,
            description: 'What kind of room should this be?',
            required: true,
            choices: roomSizes,
          },
          {
            name: 'locked',
            type: ApplicationCommandOptionType.Boolean,
            description: 'Should this channel be locked on creation?',
          },
          {
            name: 'text',
            type: ApplicationCommandOptionType.Boolean,
            description: 'Should we make a text channel too?',
          },
          {
            name: 'shown',
            type: ApplicationCommandOptionType.Boolean,
            description: 'Should this channel be visible to everyone?',
          },
          {
            name: 'name',
            type: ApplicationCommandOptionType.String,
            description: 'What should the channel you create be called?',
          },
          {
            name: 'invites',
            type: ApplicationCommandOptionType.String,
            description: 'Who do you want to have access',
          },
        ],
      },
      {
        ...cmds['rooms.destroy'],
        type: ApplicationCommandOptionType.Subcommand,
      },
      {
        ...cmds['rooms.hide'],
        type: ApplicationCommandOptionType.Subcommand,
      },
      {
        ...cmds['rooms.show'],
        type: ApplicationCommandOptionType.Subcommand,
      },
      {
        ...cmds['rooms.lock'],
        type: ApplicationCommandOptionType.Subcommand,
      },
      {
        ...cmds['rooms.unlock'],
        type: ApplicationCommandOptionType.Subcommand,
      },
      {
        ...cmds['rooms.lurkable'],
        type: ApplicationCommandOptionType.Subcommand,
      },
      {
        ...cmds['rooms.rename'],
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'name',
            type: ApplicationCommandOptionType.String,
            description: 'What do you want to rename your room to?',
            required: true,
          },
        ],
      },
      {
        ...cmds['rooms.invite'],
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'who',
            type: ApplicationCommandOptionType.User,
            description: 'Who do you want to add to your channel?',
            required: true,
          },
        ],
      },
      {
        ...cmds['rooms.block'],
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'user',
            type: ApplicationCommandOptionType.User,
            description: 'Who do you want to block from your channel?',
            required: true,
          },
        ],
      },
      {
        ...cmds['rooms.resize'],
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'type',
            type: ApplicationCommandOptionType.Number,
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

    let show = options?.room?.voiceChannel?.permissionsFor(everyone).has(PermissionsBitField.Flags.ViewChannel);
    let connect = options?.room?.voiceChannel?.permissionsFor(everyone)?.has(PermissionsBitField.Flags.Connect);
    if (
      options?.category &&
      !options.category
        .permissionsFor(interaction.client.user.id)
        .has([PermissionsBitField.Flags.ManageChannels, PermissionsBitField.Flags.ManageGuild])
    ) {
      return interaction.reply({
        content: 'Bot missing manage channels perms',
        flags: ctx.ephemerate ? this.MessageFlags.Ephemeral : 0,
      });
    }

    await interaction.deferReply({ flags: ctx.ephemerate ? this.MessageFlags.Ephemeral : 0 });
    try {
      switch (subcommand) {
        case 'create':
          if (!ctx.createPrivateChannel) return interaction.editReply({ content: 'feature not enabled', flags: true });
          // eslint-disable-next-line no-case-declarations
          const msg = await create(interaction.guild, options);
          return typeof msg === 'string'
            ? interaction.editReply({ content: msg, flags: ctx.ephemerate ? this.MessageFlags.Ephemeral : 0 })
            : interaction.editReply({ embeds: [msg], flags: ctx.ephemerate ? this.MessageFlags.Ephemeral : 0 });
        case 'destroy':
          if (options.userHasRoom) {
            const { room } = options;
            if (room?.textChannel?.deletable) await room.textChannel.delete();
            if (room?.voiceChannel?.deletable) await room.voiceChannel.delete();
            if (room?.category?.deletable && room.category.id !== options.category.id) {
              await room.category.delete();
            }
            await ctx.settings.deletePrivateRoom(room);
            return interaction.editReply({
              content: 'Private room deleted',
              flags: ctx.ephemerate ? this.MessageFlags.Ephemeral : 0,
            });
          }
          return interaction.editReply({
            content: 'Nothing to destroy',
            flags: ctx.ephemerate ? this.MessageFlags.Ephemeral : 0,
          });
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
              Connect: true,
              ViewChannel: true,
              Speak: false,
              SendMessages: false,
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
            return interaction.editReply({
              content: 'Private room updated',
              flags: ctx.ephemerate ? this.MessageFlags.Ephemeral : 0,
            });
          }
          return interaction.editReply({
            content: 'Nothing to update',
            flags: ctx.ephemerate ? this.MessageFlags.Ephemeral : 0,
          });
        case 'rename':
          if (options.userHasRoom && options.name) {
            if (options.room?.textChannel?.manageable) {
              await options.room.textChannel.setName(
                options.name.replace(/\s/gi, '-'),
                `New name for ${options.room.textChannel.name}.`
              );
            }
            if (options.room?.voiceChannel) {
              await options.room.voiceChannel.setName(options.name, `New name for ${options.room.voiceChannel.name}.`);
            }
            if (options.room?.category) {
              await options.room.category.setName(options.name, `New name for ${options.room.category.name}.`);
            }
            return interaction.editReply({
              content: 'Done',
              flags: ctx.ephemerate ? this.MessageFlags.Ephemeral : 0,
            });
          }
          return interaction.editReply({
            content: 'Nothing to rename',
            flags: ctx.ephemerate ? this.MessageFlags.Ephemeral : 0,
          });
        case 'resize':
          if (options.userHasRoom && typeof options.limit !== 'undefined' && options.room.voiceChannel.manageable) {
            await options.room.voiceChannel.setUserLimit(options.limit);
            return interaction.editReply({
              content: 'Voice channel resized',
              flags: ctx.ephemerate ? this.MessageFlags.Ephemeral : 0,
            });
          }
          return interaction.editReply({
            content: "Couldn't resize nothingness!",
            flags: ctx.ephemerate ? this.MessageFlags.Ephemeral : 0,
          });
        case 'invite':
          if (options.userHasRoom && options.invite) {
            const { room, invite } = options;
            const audit = {
              reason: `${invite.tag} invited to room by ${interaction.user.tag}`,
              type: GuildChannelOverwriteOptionsType.MEMBER,
            };
            await this.#assignRoomOverwrites(room, invitedOverwrite, audit, invite);
            return interaction.editReply({
              content: `invited ${invite.tag}`,
              flags: ctx.ephemerate ? this.MessageFlags.Ephemeral : 0,
            });
          }
          return interaction.editReply({
            content: "Couldn't invite someone to nothingness!",
            flags: ctx.ephemerate ? this.MessageFlags.Ephemeral : 0,
          });
        case 'block':
          if (options.userHasRoom && options.invite) {
            const { room, invite } = options;
            const audit = {
              reason: `${invite.tag} blocked from room by ${interaction.user.tag}`,
              type: GuildChannelOverwriteOptionsType.MEMBER,
            };
            await this.#assignRoomOverwrites(room, blockOverwrite, audit, invite);
            return interaction.editReply({
              content: `blocked ${invite.tag}`,
              flags: ctx.ephemerate ? this.MessageFlags.Ephemeral : 0,
            });
          }
          return interaction.editReply({
            content: "Couldn't invite someone to nothingness!",
            flags: ctx.ephemerate ? this.MessageFlags.Ephemeral : 0,
          });
        default:
          break;
      }
    } catch (e) {
      this.#logger.error(e);
      return interaction.editReply('unable to act. feature requires Administrator permission on bot. Thanks discord.');
    }

    return interaction.editReply({ content: ctx.i18n`naaah`, flags: ctx.ephemerate ? this.MessageFlags.Ephemeral : 0 });
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
        return interaction.editReply({ content: "Couldn't update permissions", flags: this.MessageFlags.Ephemeral });
      }
      return interaction.editReply({
        content: 'Private room updated',
        flags: ctx.ephemerate ? this.MessageFlags.Ephemeral : 0,
      });
    }
    return interaction.editReply({
      content: 'Nothing to update',
      flags: ctx.ephemerate ? this.MessageFlags.Ephemeral : 0,
    });
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
