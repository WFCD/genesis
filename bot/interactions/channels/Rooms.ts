import {
  ApplicationCommandOptionType as Types,
  CategoryChannel,
  ChannelType,
  ChatInputCommandInteraction,
  EmbedBuilder,
  Guild,
  GuildMember,
  OverwriteType,
  PermissionFlagsBits,
  type PermissionOverwriteOptions,
  Role,
  TextChannel,
  User,
} from 'discord.js';

import type { CommandContext } from '#shared/types/context';
import type { PrivateRoom } from '#shared/settings/database/repositories/PrivateRoomRepository';
import { games, isVulgarCheck, withEphemeral } from '#shared/utilities/CommonFunctions';
import { cmds } from '#shared/resources/index';
import logger from '#shared/utilities/Logger';

import Interaction from '../../models/Interaction';

type RoomOptions = {
  author: User;
  limit: number;
  isPublic: boolean;
  useText: boolean;
  shown: boolean;
  name: string;
  invites: GuildMember[];
  invite?: User | null;
  modRole?: Role | null;
  userHasRoom: number;
  category?: CategoryChannel;
  channel?: TextChannel;
  settings: NonNullable<CommandContext['settings']>;
  room?: PrivateRoom;
};

const getMentions = (content: string, guild: Guild): GuildMember[] =>
  content
    .trim()
    .replace(/[<>!@]/gi, ' ')
    .split(' ')
    .filter((id) => id)
    .map((id) => guild.members.cache.get(id))
    .filter((member): member is GuildMember => Boolean(member));

const roomPermissions = (flags: {
  Connect?: boolean;
  ViewChannel?: boolean;
  SendMessages?: boolean;
  Speak?: boolean;
  UseVAD?: boolean;
  ManageChannels?: boolean;
}): PermissionOverwriteOptions => flags;

const makeOverwrites = (guild: Guild, options: RoomOptions) => {
  const overwrites: Array<{
    id: string;
    allow?: bigint[];
    deny?: bigint[];
    type: OverwriteType;
  }> = [];

  if (options.isPublic) {
    const everyoneDeny = [PermissionFlagsBits.Connect];
    if (!options.shown) everyoneDeny.push(PermissionFlagsBits.ViewChannel);
    overwrites.push({
      id: guild.roles.everyone.id,
      deny: everyoneDeny,
      type: OverwriteType.Role,
    });
    options.invites.forEach((user) => {
      overwrites.push({
        id: user.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.Connect,
          PermissionFlagsBits.Speak,
          PermissionFlagsBits.UseVAD,
        ],
        type: OverwriteType.Member,
      });
    });
  } else {
    overwrites.push({
      id: guild.roles.everyone.id,
      allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect],
      type: OverwriteType.Role,
    });
  }

  const me = guild.members.me;
  if (me) {
    overwrites.push(
      {
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.Connect,
          PermissionFlagsBits.MuteMembers,
          PermissionFlagsBits.DeafenMembers,
          PermissionFlagsBits.MoveMembers,
          PermissionFlagsBits.ManageRoles,
          PermissionFlagsBits.ManageChannels,
        ],
        id: me.id,
        type: OverwriteType.Member,
      },
      {
        id: options.author.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.Connect,
          PermissionFlagsBits.Speak,
          PermissionFlagsBits.UseVAD,
          PermissionFlagsBits.ManageMessages,
        ],
        type: OverwriteType.Member,
      }
    );
  }

  if (options.modRole) {
    overwrites.push({
      id: options.modRole.id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.Connect,
        PermissionFlagsBits.Speak,
        PermissionFlagsBits.UseVAD,
        PermissionFlagsBits.ManageMessages,
        PermissionFlagsBits.DeafenMembers,
        PermissionFlagsBits.MoveMembers,
      ],
      type: OverwriteType.Role,
    });
  }
  return overwrites;
};

const invitedOverwrite = roomPermissions({
  Connect: true,
  ViewChannel: true,
  SendMessages: true,
  Speak: true,
  UseVAD: true,
  ManageChannels: false,
});

const blockOverwrite = roomPermissions({
  Connect: false,
  ViewChannel: false,
  SendMessages: false,
  Speak: false,
  UseVAD: false,
});

const create = async (guild: Guild, options: RoomOptions): Promise<string | EmbedBuilder> => {
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
    (await guild.channels.create({
      name: options.name,
      type: ChannelType.GuildCategory,
      permissionOverwrites: overwrites,
    }));

  const textChannel =
    options.useText && !options.category
      ? await guild.channels.create({
          name: cleanedName,
          type: ChannelType.GuildText,
          parent: category.id,
          permissionOverwrites: overwrites,
        })
      : undefined;

  if (!textChannel && options.channel && options.useText) {
    await options.channel.threads.create({ name: options.name });
  }

  const voiceChannel = await guild.channels.create({
    name: options.name,
    type: ChannelType.GuildVoice,
    parent: category,
    permissionOverwrites: overwrites,
    userLimit: typeof options.limit !== 'undefined' ? options.limit : undefined,
  });

  await options.settings.privateRooms.addPrivateRoom(
    guild,
    textChannel,
    voiceChannel,
    category === options.category ? { id: 0 } : category,
    options.author
  );

  const me = guild.members.me;
  if (me && voiceChannel.permissionsFor(me)?.has(PermissionFlagsBits.CreateInstantInvite)) {
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
        type: Types.Subcommand,
        options: [
          {
            name: 'type',
            type: Types.Number,
            description: 'What kind of room should this be?',
            required: true,
            choices: roomSizes,
          },
          {
            name: 'locked',
            type: Types.Boolean,
            description: 'Should this channel be locked on creation?',
          },
          {
            name: 'text',
            type: Types.Boolean,
            description: 'Should we make a text channel too?',
          },
          {
            name: 'shown',
            type: Types.Boolean,
            description: 'Should this channel be visible to everyone?',
          },
          {
            name: 'name',
            type: Types.String,
            description: 'What should the channel you create be called?',
          },
          {
            name: 'invites',
            type: Types.String,
            description: 'Who do you want to have access',
          },
        ],
      },
      {
        ...cmds['rooms.destroy'],
        type: Types.Subcommand,
      },
      {
        ...cmds['rooms.hide'],
        type: Types.Subcommand,
      },
      {
        ...cmds['rooms.show'],
        type: Types.Subcommand,
      },
      {
        ...cmds['rooms.lock'],
        type: Types.Subcommand,
      },
      {
        ...cmds['rooms.unlock'],
        type: Types.Subcommand,
      },
      {
        ...cmds['rooms.lurkable'],
        type: Types.Subcommand,
      },
      {
        ...cmds['rooms.rename'],
        type: Types.Subcommand,
        options: [
          {
            name: 'name',
            type: Types.String,
            description: 'What do you want to rename your room to?',
            required: true,
          },
        ],
      },
      {
        ...cmds['rooms.invite'],
        type: Types.Subcommand,
        options: [
          {
            name: 'who',
            type: Types.User,
            description: 'Who do you want to add to your channel?',
            required: true,
          },
        ],
      },
      {
        ...cmds['rooms.block'],
        type: Types.Subcommand,
        options: [
          {
            name: 'user',
            type: Types.User,
            description: 'Who do you want to block from your channel?',
            required: true,
          },
        ],
      },
      {
        ...cmds['rooms.resize'],
        type: Types.Subcommand,
        options: [
          {
            name: 'type',
            type: Types.Number,
            description: 'What kind of room should this be?',
            required: true,
            choices: roomSizes,
          },
        ],
      },
    ],
  };

  static async commandHandler(interaction: ChatInputCommandInteraction, ctx: CommandContext) {
    if (!interaction.guild || !interaction.member || !ctx.settings) {
      return interaction.reply(withEphemeral(true, { content: 'Guild-only command' }));
    }

    const subcommand = interaction.options.getSubcommand();
    const member = interaction.member as GuildMember;
    const options: RoomOptions = {
      author: interaction.user,
      limit: interaction.options.getNumber('type') || 0,
      isPublic: interaction.options.getBoolean('locked') ?? undefined,
      useText: interaction.options.getBoolean('text') ?? undefined,
      shown: interaction.options.getBoolean('shown') ?? undefined,
      name: (interaction.options.getString('name') || `room-${member.displayName}`.toLowerCase())
        .replace(isVulgarCheck, '')
        .trim(),
      invites: getMentions(interaction.options.getString('invites') || '', interaction.guild),
      invite: interaction.options.getUser('who') ?? interaction.options.getUser('user'),
      modRole: (ctx.modRole as Role | undefined) ?? null,
      userHasRoom: await ctx.settings.privateRooms.userHasRoom(member),
      category: ctx.tempCategory as CategoryChannel | undefined,
      channel: ctx.tempChannel as TextChannel | undefined,
      settings: ctx.settings,
    };

    options.room = await ctx.settings.privateRooms.getUsersRoom(member);
    options.isPublic = typeof options.isPublic === 'undefined' ? !ctx.defaultRoomsLocked : options.isPublic;
    const alwaysText = options.category ? false : options.useText;
    options.useText = typeof options.useText === 'undefined' ? !ctx.defaultNoText : alwaysText;
    options.shown = typeof options.shown === 'undefined' ? Boolean(ctx.defaultShown) : options.shown;

    const { everyone } = interaction.guild.roles;
    const voiceChannel = options.room?.voiceChannel;
    let show = voiceChannel?.permissionsFor(everyone)?.has(PermissionFlagsBits.ViewChannel) ?? false;
    let connect = voiceChannel?.permissionsFor(everyone)?.has(PermissionFlagsBits.Connect) ?? false;

    if (
      options.category &&
      !options.category
        .permissionsFor(interaction.client.user.id)
        ?.has([PermissionFlagsBits.ManageChannels, PermissionFlagsBits.ManageGuild])
    ) {
      return interaction.reply(withEphemeral(ctx.ephemerate, { content: 'Bot missing manage channels perms' }));
    }

    await interaction.deferReply(withEphemeral(ctx.ephemerate));

    try {
      switch (subcommand) {
        case 'create':
          if (!ctx.createPrivateChannel)
            return interaction.editReply(withEphemeral(true, { content: 'feature not enabled' }));

          const msg = await create(interaction.guild, options);
          return typeof msg === 'string'
            ? interaction.editReply(withEphemeral(ctx.ephemerate, { content: msg }))
            : interaction.editReply(withEphemeral(ctx.ephemerate, { embeds: [msg] }));
        case 'destroy':
          if (options.userHasRoom && options.room) {
            const { room } = options;
            if (room.textChannel?.deletable) await room.textChannel.delete();
            if (room.voiceChannel?.deletable) await room.voiceChannel.delete();
            if (room.category?.deletable && options.category && room.category.id !== options.category.id) {
              await room.category.delete();
            }
            await ctx.settings.privateRooms.deletePrivateRoom(room);
            return interaction.editReply(withEphemeral(ctx.ephemerate, { content: 'Private room deleted' }));
          }
          return interaction.editReply(withEphemeral(ctx.ephemerate, { content: 'Nothing to destroy' }));
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
          if (options.userHasRoom && options.room) {
            const overwrite = roomPermissions({
              Connect: true,
              ViewChannel: true,
              Speak: false,
              SendMessages: false,
            });
            await this.#assignRoomOverwrites(options.room, overwrite, `Room updated by ${interaction.user.tag}`);
            return interaction.editReply(withEphemeral(ctx.ephemerate, { content: 'Private room updated' }));
          }
          return interaction.editReply(withEphemeral(ctx.ephemerate, { content: 'Nothing to update' }));
        case 'rename':
          if (options.userHasRoom && options.name && options.room) {
            if (options.room.textChannel?.manageable) {
              await options.room.textChannel.setName(
                options.name.replace(/\s/gi, '-'),
                `New name for ${options.room.textChannel.name}.`
              );
            }
            if (options.room.voiceChannel) {
              await options.room.voiceChannel.setName(options.name, `New name for ${options.room.voiceChannel.name}.`);
            }
            if (options.room.category) {
              await options.room.category.setName(options.name, `New name for ${options.room.category.name}.`);
            }
            return interaction.editReply(withEphemeral(ctx.ephemerate, { content: 'Done' }));
          }
          return interaction.editReply(withEphemeral(ctx.ephemerate, { content: 'Nothing to rename' }));
        case 'resize':
          if (options.userHasRoom && typeof options.limit !== 'undefined' && options.room?.voiceChannel?.manageable) {
            await options.room.voiceChannel.setUserLimit(options.limit);
            return interaction.editReply(withEphemeral(ctx.ephemerate, { content: 'Voice channel resized' }));
          }
          return interaction.editReply(withEphemeral(ctx.ephemerate, { content: "Couldn't resize nothingness!" }));
        case 'invite':
          if (options.userHasRoom && options.invite && options.room) {
            await this.#assignRoomOverwrites(
              options.room,
              invitedOverwrite,
              `${options.invite.tag} invited to room by ${interaction.user.tag}`,
              options.invite
            );
            return interaction.editReply(withEphemeral(ctx.ephemerate, { content: `invited ${options.invite.tag}` }));
          }
          return interaction.editReply(
            withEphemeral(ctx.ephemerate, { content: "Couldn't invite someone to nothingness!" })
          );
        case 'block':
          if (options.userHasRoom && options.invite && options.room) {
            await this.#assignRoomOverwrites(
              options.room,
              blockOverwrite,
              `${options.invite.tag} blocked from room by ${interaction.user.tag}`,
              options.invite
            );
            return interaction.editReply(withEphemeral(ctx.ephemerate, { content: `blocked ${options.invite.tag}` }));
          }
          return interaction.editReply(
            withEphemeral(ctx.ephemerate, { content: "Couldn't invite someone to nothingness!" })
          );
        default:
          break;
      }
    } catch (e) {
      this.#logger.error(e);
      return interaction.editReply('unable to act. feature requires Administrator permission on bot. Thanks discord.');
    }

    return interaction.editReply(withEphemeral(ctx.ephemerate, { content: ctx.i18n`naaah` }));
  }

  static async #roomUpdate(
    options: RoomOptions,
    connect: boolean,
    show: boolean,
    interaction: ChatInputCommandInteraction,
    ctx: CommandContext
  ) {
    if (options.userHasRoom && options.room) {
      const overwrite = roomPermissions({ Connect: connect, ViewChannel: show });
      try {
        await this.#assignRoomOverwrites(options.room, overwrite, `Room updated by ${interaction.user.tag}`);
      } catch (e) {
        this.#logger.error(e);
        return interaction.editReply(withEphemeral(true, { content: "Couldn't update permissions" }));
      }
      return interaction.editReply(withEphemeral(ctx.ephemerate, { content: 'Private room updated' }));
    }
    return interaction.editReply(withEphemeral(ctx.ephemerate, { content: 'Nothing to update' }));
  }

  static async #assignRoomOverwrites(
    room: PrivateRoom,
    overwrite: PermissionOverwriteOptions,
    reason: string,
    user?: User
  ) {
    const { guild, textChannel, voiceChannel, category } = room;
    if (!guild) return;

    const target = user?.id ?? guild.roles.everyone.id;
    if (textChannel?.manageable) {
      await textChannel.permissionOverwrites.edit(target, overwrite, { reason });
    }
    if (voiceChannel?.manageable) {
      await voiceChannel.permissionOverwrites.edit(target, overwrite, { reason });
    }
    if (category?.manageable) {
      await category.permissionOverwrites.edit(target, overwrite, { reason });
    }
  }
}
