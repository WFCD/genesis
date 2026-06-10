import {
  CategoryChannel,
  Guild,
  GuildMember,
  OverwriteType,
  PermissionFlagsBits,
  type PermissionOverwriteOptions,
  Role,
  User,
} from 'discord.js';

import type { PrivateRoom } from '#shared/settings/database/repositories/PrivateRoomRepository';
import type { Database } from '#shared/types/database';
import { isVulgarCheck } from '#shared/utilities/CommonFunctions';

/** Voice user limits for manage-panel select (values must be unique). */
export const ROOM_VOICE_LIMITS = [
  { name: 'Unlimited (∞)', value: 0 },
  { name: 'Raid (8)', value: 8 },
  { name: 'Team (4)', value: 4 },
] as const;

/** Slash command room types; Chat uses -1 so choice values stay unique. */
export const ROOM_SIZES = [
  { name: 'Room (∞)', value: 0 },
  { name: 'Raid (8)', value: 8 },
  { name: 'Team (4)', value: 4 },
  { name: 'Chat (∞)', value: -1 },
] as const;

export const voiceLimitFromRoomType = (type: number | null) => (type === -1 || type === 0 || type === null ? 0 : type);

export const getMentions = (content: string, guild: Guild): GuildMember[] =>
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

export const invitedOverwrite = roomPermissions({
  Connect: true,
  ViewChannel: true,
  SendMessages: true,
  Speak: true,
  UseVAD: true,
  ManageChannels: false,
});

export const blockOverwrite = roomPermissions({
  Connect: false,
  ViewChannel: false,
  SendMessages: false,
  Speak: false,
  UseVAD: false,
});

export const getRoomVisibility = (guild: Guild, room: PrivateRoom) => {
  const { everyone } = guild.roles;
  const voiceChannel = room.voiceChannel;
  return {
    show: voiceChannel?.permissionsFor(everyone)?.has(PermissionFlagsBits.ViewChannel) ?? false,
    connect: voiceChannel?.permissionsFor(everyone)?.has(PermissionFlagsBits.Connect) ?? false,
    limit: voiceChannel?.userLimit ?? 0,
  };
};

export const lurkableOverwrite = roomPermissions({
  Connect: true,
  ViewChannel: true,
  Speak: false,
  SendMessages: false,
});

export const getRoomLurkable = (guild: Guild, room: PrivateRoom) => {
  const channel = room.voiceChannel;
  if (!channel) return false;
  const perms = channel.permissionsFor(guild.roles.everyone);
  if (!perms) return false;
  return (
    perms.has(PermissionFlagsBits.Connect) &&
    perms.has(PermissionFlagsBits.ViewChannel) &&
    !perms.has(PermissionFlagsBits.Speak)
  );
};

export async function setRoomLurkable(room: PrivateRoom, guild: Guild, lurkable: boolean, reason: string) {
  if (lurkable) {
    await assignRoomOverwrites(room, lurkableOverwrite, reason);
    return;
  }

  const { connect, show } = getRoomVisibility(guild, room);
  await assignRoomOverwrites(
    room,
    roomPermissions({
      Connect: connect,
      ViewChannel: show,
      Speak: connect,
      SendMessages: room.textChannel ? show : undefined,
    }),
    reason
  );
}

export async function renamePrivateRoom(room: PrivateRoom, rawName: string) {
  const name = rawName.replace(isVulgarCheck, '').trim();
  if (!name) throw new Error('Invalid room name');

  if (room.textChannel?.manageable) {
    await room.textChannel.setName(name.replace(/\s/gi, '-'), `New name for ${room.textChannel.name}.`);
  }
  if (room.voiceChannel?.manageable) {
    await room.voiceChannel.setName(name, `New name for ${room.voiceChannel.name}.`);
  }
  if (room.category?.manageable) {
    await room.category.setName(name, `New name for ${room.category.name}.`);
  }

  return name;
}

const skipMemberOverwrite = (memberId: string, ownerId: string, botId?: string) =>
  memberId === ownerId || (botId !== undefined && memberId === botId);

const memberChannelAccess = (
  channel: PrivateRoom['voiceChannel'] | PrivateRoom['textChannel'],
  subject: GuildMember | string
) => {
  const perms = channel?.permissionsFor(subject);
  return {
    view: perms?.has(PermissionFlagsBits.ViewChannel) ?? false,
    connect: perms?.has(PermissionFlagsBits.Connect) ?? false,
    speak: perms?.has(PermissionFlagsBits.Speak) ?? false,
  };
};

const collectRoomMemberOverwriteIds = (room: PrivateRoom, ownerId: string, botId?: string) => {
  const ids = new Set<string>();
  for (const channel of [room.voiceChannel, room.textChannel, room.category]) {
    if (!channel) continue;
    for (const overwrite of channel.permissionOverwrites.cache.values()) {
      if (overwrite.type !== OverwriteType.Member) continue;
      if (skipMemberOverwrite(overwrite.id, ownerId, botId)) continue;
      ids.add(overwrite.id);
    }
  }
  return ids;
};

const resolveMemberSubject = async (guild: Guild | undefined, memberId: string) => {
  if (!guild) return memberId;
  const cached = guild.members.cache.get(memberId);
  if (cached) return cached;
  return guild.members.fetch(memberId).catch(() => memberId);
};

/** Classify members with room overwrites from effective voice-channel permissions. */
export const getRoomMemberAccess = async (room: PrivateRoom, ownerId: string, botId?: string, guild?: Guild) => {
  const invitedIds: string[] = [];
  const blockedIds: string[] = [];
  const voice = room.voiceChannel;
  if (!voice) return { invitedIds, blockedIds };

  for (const memberId of collectRoomMemberOverwriteIds(room, ownerId, botId)) {
    const subject = await resolveMemberSubject(guild, memberId);
    const access = memberChannelAccess(voice, subject);

    if (access.view) {
      invitedIds.push(memberId);
    } else {
      blockedIds.push(memberId);
    }
  }

  return { invitedIds, blockedIds };
};

export async function removeRoomOverwrites(room: PrivateRoom, user: User, reason: string) {
  const { textChannel, voiceChannel, category } = room;
  if (voiceChannel?.manageable) {
    await voiceChannel.permissionOverwrites.delete(user.id, reason);
  }
  if (textChannel?.manageable) {
    await textChannel.permissionOverwrites.delete(user.id, reason);
  }
  if (category?.manageable) {
    await category.permissionOverwrites.delete(user.id, reason);
  }
}

export async function applyRoomMemberAccessChanges(
  room: PrivateRoom,
  baseline: { invitedIds: string[]; blockedIds: string[] },
  pending: { invitedIds: string[]; blockedIds: string[] },
  resolveUser: (userId: string) => Promise<User | undefined>,
  reason: string
) {
  const toUninvite = baseline.invitedIds.filter((id) => !pending.invitedIds.includes(id));
  const toUnblock = baseline.blockedIds.filter((id) => !pending.blockedIds.includes(id));
  const toInvite = pending.invitedIds.filter(
    (id) => !baseline.invitedIds.includes(id) && !pending.blockedIds.includes(id)
  );
  const toBlock = pending.blockedIds.filter((id) => !baseline.blockedIds.includes(id));

  for (const userId of toUninvite) {
    const user = await resolveUser(userId);
    if (user) await removeRoomOverwrites(room, user, reason);
  }
  for (const userId of toUnblock) {
    const user = await resolveUser(userId);
    if (user) await removeRoomOverwrites(room, user, reason);
  }
  for (const userId of toInvite) {
    const user = await resolveUser(userId);
    if (user) await assignRoomOverwrites(room, invitedOverwrite, `${user.tag} invited via manage panel`, user);
  }
  for (const userId of toBlock) {
    const user = await resolveUser(userId);
    if (user) await assignRoomOverwrites(room, blockOverwrite, `${user.tag} blocked via manage panel`, user);
  }
}

export async function assignRoomOverwrites(
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

export async function updateRoomVisibility(room: PrivateRoom, connect: boolean, show: boolean, reason: string) {
  const overwrite = roomPermissions({ Connect: connect, ViewChannel: show });
  await assignRoomOverwrites(room, overwrite, reason);
}

export async function resizeRoom(room: PrivateRoom, limit: number) {
  if (room.voiceChannel?.manageable) {
    await room.voiceChannel.setUserLimit(limit);
  }
}

export async function destroyPrivateRoom(room: PrivateRoom, settings: Database, tempCategory?: CategoryChannel) {
  if (room.textChannel?.deletable) await room.textChannel.delete();
  if (room.voiceChannel?.deletable) await room.voiceChannel.delete();
  if (room.category?.deletable && tempCategory && room.category.id !== tempCategory.id) {
    await room.category.delete();
  }
  await settings.privateRooms.deletePrivateRoom(room);
}

export type CreateRoomOptions = {
  author: User;
  limit: number;
  isPublic: boolean;
  useText: boolean;
  shown: boolean;
  name: string;
  invites: GuildMember[];
  modRole?: Role | null;
  userHasRoom: number;
  category?: CategoryChannel;
  channel?: { threads: { create: (opts: { name: string }) => Promise<unknown> } };
  settings: Database;
};

export const makeOverwrites = (guild: Guild, options: CreateRoomOptions) => {
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
