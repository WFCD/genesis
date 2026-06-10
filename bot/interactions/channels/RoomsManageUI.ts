import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  CategoryChannel,
  EmbedBuilder,
  GuildMember,
  ModalBuilder,
  StringSelectMenuBuilder,
  TextInputBuilder,
  TextInputStyle,
  UserSelectMenuBuilder,
  type ChatInputCommandInteraction,
  type MessageComponentInteraction,
  type ModalSubmitInteraction,
} from 'discord.js';

import type { PrivateRoom } from '#shared/settings/database/repositories/PrivateRoomRepository';
import type { CommandContext } from '#shared/types/context';
import { withEphemeral } from '#shared/utilities/CommonFunctions';

import {
  applyRoomMemberAccessChanges,
  destroyPrivateRoom,
  getRoomLurkable,
  getRoomMemberAccess,
  getRoomVisibility,
  renamePrivateRoom,
  resizeRoom,
  setRoomLurkable,
  updateRoomVisibility,
  ROOM_VOICE_LIMITS,
} from './roomActions';

const PREFIX = 'rm';
const SESSION_TTL_MS = 15 * 60 * 1000;

type RoomSession = {
  userId: string;
  guildId: string;
  expiresAt: number;
  baselineInviteIds: string[];
  baselineBlockIds: string[];
  pendingInviteIds: string[];
  pendingBlockIds: string[];
};

const sessions = new Map<string, RoomSession>();

const sessionKey = (userId: string, guildId: string) => `${userId}:${guildId}`;

const parseId = (customId: string) => {
  const parts = customId.split(':');
  return {
    guildId: parts[1],
    ownerId: parts[2],
    component: parts.slice(3).join(':'),
  };
};

const buildId = (guildId: string, ownerId: string, component: string) => `${PREFIX}:${guildId}:${ownerId}:${component}`;

const sizeLabel = (limit: number) => ROOM_VOICE_LIMITS.find((s) => s.value === limit)?.name ?? `Limit ${limit}`;

const idsEqual = (a: string[], b: string[]) => {
  if (a.length !== b.length) return false;
  const left = [...a].sort();
  const right = [...b].sort();
  return left.every((id, index) => id === right[index]);
};

const formatUserList = (ids: string[]) => (ids.length ? ids.map((id) => `<@${id}>`).join(', ') : '_None_');

type ManageInteraction = ChatInputCommandInteraction;

export default class RoomsManageUI {
  static isManageComponent(customId: string) {
    return customId.startsWith(`${PREFIX}:`);
  }

  static isManageModal(customId: string) {
    return customId.startsWith(`${PREFIX}:`) && customId.endsWith(':rename');
  }

  static #getSession(userId: string, guildId: string) {
    const session = sessions.get(sessionKey(userId, guildId));
    if (!session || session.expiresAt < Date.now()) {
      sessions.delete(sessionKey(userId, guildId));
      return undefined;
    }
    return session;
  }

  static #touchSession(session: RoomSession) {
    session.expiresAt = Date.now() + SESSION_TTL_MS;
    sessions.set(sessionKey(session.userId, session.guildId), session);
  }

  static async #loadRoom(member: GuildMember, ctx: CommandContext) {
    if (!ctx.settings) return undefined;
    const room = await ctx.settings.privateRooms.getUsersRoom(member);
    if (!room?.voiceChannel) return undefined;
    return room;
  }

  static async #seedMembersSession(
    session: RoomSession,
    room: PrivateRoom,
    ownerId: string,
    guild: NonNullable<MessageComponentInteraction['guild']>
  ) {
    const access = await getRoomMemberAccess(room, ownerId, guild.members.me?.id, guild);
    session.baselineInviteIds = [...access.invitedIds];
    session.baselineBlockIds = [...access.blockedIds];
    session.pendingInviteIds = [...access.invitedIds];
    session.pendingBlockIds = [...access.blockedIds];
  }

  static #membersAccessChanged(session: RoomSession) {
    return (
      !idsEqual(session.pendingInviteIds, session.baselineInviteIds) ||
      !idsEqual(session.pendingBlockIds, session.baselineBlockIds)
    );
  }

  static async #resolveUser(interaction: MessageComponentInteraction, userId: string) {
    if (!interaction.guild) return undefined;
    return (
      interaction.guild.members.cache.get(userId)?.user ??
      (await interaction.client.users.fetch(userId).catch(() => undefined))
    );
  }

  static async start(interaction: ManageInteraction, ctx: CommandContext) {
    if (!interaction.guild || !interaction.member || !ctx.settings) {
      return interaction.reply(withEphemeral(true, { content: 'Guild-only command.' }));
    }

    const member = interaction.member as GuildMember;
    const room = await this.#loadRoom(member, ctx);
    if (!room) {
      if (!interaction.deferred && !interaction.replied) {
        return interaction.reply(withEphemeral(true, { content: 'You do not have a private room to manage.' }));
      }
      return interaction.editReply(withEphemeral(true, { content: 'You do not have a private room to manage.' }));
    }

    if (!interaction.deferred && !interaction.replied) {
      await interaction.deferReply(withEphemeral(true));
    }

    const session: RoomSession = {
      userId: interaction.user.id,
      guildId: interaction.guild.id,
      expiresAt: Date.now() + SESSION_TTL_MS,
      baselineInviteIds: [],
      baselineBlockIds: [],
      pendingInviteIds: [],
      pendingBlockIds: [],
    };
    this.#touchSession(session);

    return interaction.editReply(this.#render(interaction.guild, room, session));
  }

  static async handleComponent(interaction: MessageComponentInteraction, ctx: CommandContext) {
    const { guildId, ownerId, component } = parseId(interaction.customId);
    if (!interaction.guild || interaction.guild.id !== guildId) {
      return interaction.reply(withEphemeral(true, { content: 'This panel is for a different server.' }));
    }

    if (interaction.user.id !== ownerId) {
      return interaction.reply(withEphemeral(true, { content: 'Only the room owner can use this panel.' }));
    }

    const session = this.#getSession(ownerId, guildId);
    if (!session) {
      return interaction.reply(withEphemeral(true, { content: 'Session expired — run `/rooms create` again.' }));
    }

    const member = interaction.member as GuildMember;
    const room = await this.#loadRoom(member, ctx);
    if (!room) {
      sessions.delete(sessionKey(ownerId, guildId));
      return interaction.update({ content: 'Your private room no longer exists.', embeds: [], components: [] });
    }

    if (component === 'members' && interaction.isButton()) {
      await this.#seedMembersSession(session, room, ownerId, interaction.guild);
      await interaction.deferUpdate();
      this.#touchSession(session);
      return interaction.editReply(this.#renderMembers(session));
    }

    if (component === 'members-back' && interaction.isButton()) {
      session.baselineInviteIds = [];
      session.baselineBlockIds = [];
      session.pendingInviteIds = [];
      session.pendingBlockIds = [];
      await interaction.deferUpdate();
      this.#touchSession(session);
      return interaction.editReply(this.#render(interaction.guild, room, session));
    }

    if (component === 'members-add' && interaction.isUserSelectMenu()) {
      session.pendingInviteIds = [...interaction.users.keys()];
      await interaction.deferUpdate();
      this.#touchSession(session);
      return interaction.editReply(this.#renderMembers(session));
    }

    if (component === 'members-remove' && interaction.isUserSelectMenu()) {
      session.pendingBlockIds = [...interaction.users.keys()];
      await interaction.deferUpdate();
      this.#touchSession(session);
      return interaction.editReply(this.#renderMembers(session));
    }

    if (component === 'members-apply' && interaction.isButton()) {
      await interaction.deferUpdate();
      try {
        const reason = `Room access updated by ${interaction.user.tag} via manage panel`;
        await applyRoomMemberAccessChanges(
          room,
          { invitedIds: session.baselineInviteIds, blockedIds: session.baselineBlockIds },
          { invitedIds: session.pendingInviteIds, blockedIds: session.pendingBlockIds },
          (userId) => this.#resolveUser(interaction, userId),
          reason
        );

        session.baselineInviteIds = [];
        session.baselineBlockIds = [];
        session.pendingInviteIds = [];
        session.pendingBlockIds = [];
        this.#touchSession(session);
        return interaction.editReply(this.#render(interaction.guild, room, session));
      } catch (err) {
        ctx.logger?.error(err, 'RM');
        return interaction.followUp(
          withEphemeral(true, { content: 'Something went wrong. Try `/rooms create` again.' })
        );
      }
    }

    if (component === 'rename' && interaction.isButton()) {
      return interaction.showModal(this.#renameModal(guildId, ownerId, room.voiceChannel?.name ?? ''));
    }

    await interaction.deferUpdate();

    try {
      const { connect, show } = getRoomVisibility(interaction.guild, room);
      const reason = `Room updated by ${interaction.user.tag} via manage panel`;

      switch (component) {
        case 'toggle-lock':
          await updateRoomVisibility(room, !connect, show, reason);
          break;
        case 'toggle-show':
          await updateRoomVisibility(room, connect, !show, reason);
          break;
        case 'toggle-lurkable': {
          const lurkable = getRoomLurkable(interaction.guild, room);
          await setRoomLurkable(room, interaction.guild, !lurkable, reason);
          break;
        }
        case 'destroy':
          await destroyPrivateRoom(room, ctx.settings!, ctx.tempCategory as CategoryChannel | undefined);
          sessions.delete(sessionKey(ownerId, guildId));
          return interaction.editReply({
            content: 'Private room destroyed.',
            embeds: [],
            components: [],
          });
        default:
          if (component === 'size' && interaction.isStringSelectMenu()) {
            const limit = Number.parseInt(interaction.values[0], 10);
            if (!Number.isNaN(limit)) {
              await resizeRoom(room, limit);
            }
          }
          break;
      }

      this.#touchSession(session);
      return interaction.editReply(this.#render(interaction.guild, room, session));
    } catch (err) {
      ctx.logger?.error(err, 'RM');
      return interaction.followUp(withEphemeral(true, { content: 'Something went wrong. Try `/rooms create` again.' }));
    }
  }

  static async handleModalSubmit(interaction: ModalSubmitInteraction, ctx: CommandContext) {
    const { guildId, ownerId, component } = parseId(interaction.customId);
    if (!interaction.guild || interaction.guild.id !== guildId || component !== 'rename') {
      return interaction.reply(withEphemeral(true, { content: 'This form is for a different server.' }));
    }

    if (interaction.user.id !== ownerId) {
      return interaction.reply(withEphemeral(true, { content: 'Only the room owner can use this panel.' }));
    }

    const session = this.#getSession(ownerId, guildId);
    if (!session) {
      return interaction.reply(withEphemeral(true, { content: 'Session expired — run `/rooms create` again.' }));
    }

    const member = interaction.member as GuildMember;
    const room = await this.#loadRoom(member, ctx);
    if (!room) {
      sessions.delete(sessionKey(ownerId, guildId));
      return interaction.reply(withEphemeral(true, { content: 'Your private room no longer exists.' }));
    }

    await interaction.deferUpdate();

    try {
      await renamePrivateRoom(room, interaction.fields.getTextInputValue('name'));
      this.#touchSession(session);
      return interaction.message?.edit(this.#render(interaction.guild, room, session));
    } catch (err) {
      ctx.logger?.error(err, 'RM');
      return interaction.followUp(
        withEphemeral(true, { content: 'Could not rename room — check the name and try again.' })
      );
    }
  }

  static #renameModal(guildId: string, ownerId: string, currentName: string) {
    return new ModalBuilder()
      .setCustomId(buildId(guildId, ownerId, 'rename'))
      .setTitle('Rename Room')
      .addComponents(
        new ActionRowBuilder<TextInputBuilder>().addComponents(
          new TextInputBuilder()
            .setCustomId('name')
            .setLabel('Room name')
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
            .setMaxLength(100)
            .setValue(currentName.slice(0, 100))
        )
      );
  }

  static #renderMembers(session: RoomSession) {
    const { guildId, userId } = session;
    const changed = this.#membersAccessChanged(session);

    const description = [
      'Adjust who can access your room. Deselect someone to remove their override.',
      `**Allowed:** ${formatUserList(session.pendingInviteIds)}`,
      `**Blocked:** ${formatUserList(session.pendingBlockIds)}`,
    ].join('\n\n');

    const addSelect = new UserSelectMenuBuilder()
      .setCustomId(buildId(guildId, userId, 'members-add'))
      .setPlaceholder('Allowed members')
      .setMinValues(0)
      .setMaxValues(25);

    if (session.pendingInviteIds.length) {
      addSelect.setDefaultUsers(session.pendingInviteIds);
    }

    const removeSelect = new UserSelectMenuBuilder()
      .setCustomId(buildId(guildId, userId, 'members-remove'))
      .setPlaceholder('Blocked members')
      .setMinValues(0)
      .setMaxValues(25);

    if (session.pendingBlockIds.length) {
      removeSelect.setDefaultUsers(session.pendingBlockIds);
    }

    return withEphemeral(true, {
      embeds: [new EmbedBuilder().setTitle('Room Members').setColor(0x77dd77).setDescription(description)],
      components: [
        new ActionRowBuilder<UserSelectMenuBuilder>().addComponents(addSelect),
        new ActionRowBuilder<UserSelectMenuBuilder>().addComponents(removeSelect),
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId(buildId(guildId, userId, 'members-apply'))
            .setLabel('Update Access')
            .setStyle(ButtonStyle.Success)
            .setDisabled(!changed),
          new ButtonBuilder()
            .setCustomId(buildId(guildId, userId, 'members-back'))
            .setLabel('Back')
            .setStyle(ButtonStyle.Secondary)
        ),
      ],
    });
  }

  static #render(guild: NonNullable<ChatInputCommandInteraction['guild']>, room: PrivateRoom, session: RoomSession) {
    const { connect, show, limit } = getRoomVisibility(guild, room);
    const lurkable = getRoomLurkable(guild, room);
    const voice = room.voiceChannel;

    const embed = new EmbedBuilder()
      .setTitle('Manage Private Room')
      .setColor(0x77dd77)
      .setDescription(
        [
          voice ? `Voice: ${voice}` : 'Voice channel missing',
          room.textChannel ? `Text: ${room.textChannel}` : null,
          `Name: ${voice?.name ?? 'unknown'}`,
          `Size: ${sizeLabel(limit)}`,
          `Locked: ${connect ? 'No' : 'Yes'}`,
          `Visible: ${show ? 'Yes' : 'No'}`,
          `Lurkable: ${lurkable ? 'Yes' : 'No'}`,
        ]
          .filter(Boolean)
          .join('\n')
      );

    const { guildId, userId } = session;

    return withEphemeral(true, {
      embeds: [embed],
      components: [
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId(buildId(guildId, userId, 'toggle-lock'))
            .setLabel(connect ? 'Lock' : 'Unlock')
            .setStyle(connect ? ButtonStyle.Secondary : ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId(buildId(guildId, userId, 'toggle-show'))
            .setLabel(show ? 'Hide' : 'Show')
            .setStyle(show ? ButtonStyle.Secondary : ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId(buildId(guildId, userId, 'members'))
            .setLabel('Members')
            .setStyle(ButtonStyle.Secondary)
        ),
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId(buildId(guildId, userId, 'rename'))
            .setLabel('Rename')
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId(buildId(guildId, userId, 'toggle-lurkable'))
            .setLabel(lurkable ? 'Allow Speak' : 'Lurkable')
            .setStyle(lurkable ? ButtonStyle.Secondary : ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId(buildId(guildId, userId, 'destroy'))
            .setLabel('Destroy Room')
            .setStyle(ButtonStyle.Danger)
        ),
        new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId(buildId(guildId, userId, 'size'))
            .setPlaceholder('Change room size')
            .addOptions(
              ROOM_VOICE_LIMITS.map((size) => ({
                label: size.name,
                value: String(size.value),
                default: size.value === limit,
              }))
            )
        ),
      ],
    });
  }
}
