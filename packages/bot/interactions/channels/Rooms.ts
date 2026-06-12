import {
  ApplicationCommandOptionType as Types,
  CategoryChannel,
  ChannelType,
  ChatInputCommandInteraction,
  EmbedBuilder,
  Guild,
  GuildMember,
  PermissionFlagsBits,
  Role,
  TextChannel,
} from 'discord.js';

import type { CommandContext } from '#shared/types/context';
import { games, isVulgarCheck, withEphemeral } from '#shared/utilities/CommonFunctions';
import { cmds } from '#shared/resources/index';
import logger from '#shared/utilities/Logger';

import Interaction from '../../models/Interaction';

import { ROOM_SIZES, getMentions, makeOverwrites, voiceLimitFromRoomType, type CreateRoomOptions } from './roomActions';
import RoomsManageUI from './RoomsManageUI';

type RoomOptions = CreateRoomOptions & {
  room?: Awaited<ReturnType<NonNullable<CommandContext['settings']>['privateRooms']['getUsersRoom']>>;
};

const roomSizes = [...ROOM_SIZES];

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
    ],
  };

  static async commandHandler(interaction: ChatInputCommandInteraction, ctx: CommandContext) {
    if (!interaction.guild || !interaction.member || !ctx.settings) {
      return interaction.reply(withEphemeral(true, { content: 'Guild-only command' }));
    }

    if (interaction.options.getSubcommand() !== 'create') {
      return interaction.reply(withEphemeral(true, { content: 'Use `/rooms create`.' }));
    }

    const member = interaction.member as GuildMember;
    const roomType = interaction.options.getNumber('type', true);
    const userHasRoom = await ctx.settings.privateRooms.userHasRoom(member);
    const existingRoom = await ctx.settings.privateRooms.getUsersRoom(member);

    if (userHasRoom && existingRoom) {
      return RoomsManageUI.start(interaction, ctx);
    }

    const options: RoomOptions = {
      author: interaction.user,
      limit: voiceLimitFromRoomType(roomType),
      isPublic: interaction.options.getBoolean('locked') ?? undefined,
      useText: interaction.options.getBoolean('text') ?? (roomType === -1 ? true : undefined),
      shown: interaction.options.getBoolean('shown') ?? undefined,
      name: (interaction.options.getString('name') || `room-${member.displayName}`.toLowerCase())
        .replace(isVulgarCheck, '')
        .trim(),
      invites: getMentions(interaction.options.getString('invites') || '', interaction.guild),
      modRole: (ctx.modRole as Role | undefined) ?? null,
      userHasRoom,
      category: ctx.tempCategory as CategoryChannel | undefined,
      channel: ctx.tempChannel as TextChannel | undefined,
      settings: ctx.settings,
    };

    options.isPublic = typeof options.isPublic === 'undefined' ? !ctx.defaultRoomsLocked : options.isPublic;
    const alwaysText = options.category ? false : options.useText;
    options.useText = typeof options.useText === 'undefined' ? !ctx.defaultNoText : alwaysText;
    options.shown = typeof options.shown === 'undefined' ? Boolean(ctx.defaultShown) : options.shown;

    if (
      options.category &&
      !options.category
        .permissionsFor(interaction.client.user.id)
        ?.has([PermissionFlagsBits.ManageChannels, PermissionFlagsBits.ManageGuild])
    ) {
      return interaction.reply(withEphemeral(ctx.ephemerate, { content: 'Bot missing manage channels perms' }));
    }

    if (!ctx.createPrivateChannel) {
      return interaction.reply(withEphemeral(true, { content: 'feature not enabled' }));
    }

    await interaction.deferReply(withEphemeral(true));

    try {
      const msg = await create(interaction.guild, options);
      if (typeof msg === 'string') {
        return interaction.editReply(withEphemeral(true, { content: msg }));
      }
      return RoomsManageUI.start(interaction, ctx);
    } catch (e) {
      this.#logger.error(e);
      return interaction.editReply('unable to act. feature requires Administrator permission on bot. Thanks discord.');
    }
  }
}
