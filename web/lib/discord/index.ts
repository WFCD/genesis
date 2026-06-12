import 'server-only';

import env from '@/lib/env';
import { getCached } from '@/lib/cache/server';
import type { GuildChannelNode } from '@/lib/channels/tree';

import type { DiscordGuildInfo, DiscordGuildInfoError } from './types';

export type { DiscordGuildInfo, DiscordGuildInfoError } from '@/lib/discord/types';

const DISCORD_API = 'https://discord.com/api/v10';
const DEFAULT_BOT_AVATAR = 'https://cdn.warframestat.us/genesis/img/avatar.png';

export type DiscordChannelSummary = GuildChannelNode;

const normalizeBotToken = (token?: string) => token?.replace(/\s+/g, '') || undefined;

const botHeaders = () => {
  const token = normalizeBotToken(env.bot.token);
  if (!token) return null;
  return {
    Authorization: `Bot ${token}`,
    'Content-Type': 'application/json',
  };
};

async function fetchDiscordGuildChannels(guildId: string): Promise<GuildChannelNode[] | null> {
  const headers = botHeaders();
  if (!headers) return null;

  const res = await fetch(`${DISCORD_API}/guilds/${guildId}/channels`, {
    headers,
    cache: 'no-store',
  });
  if (!res.ok) return null;

  const channels = (await res.json()) as Array<{
    id: string;
    name: string;
    type: number;
    parent_id?: string | null;
    position?: number;
  }>;

  return channels
    .filter((channel) => [0, 4, 5, 15].includes(channel.type))
    .map((channel) => ({
      id: channel.id,
      name: channel.name,
      type: channel.type,
      parentId: channel.parent_id ?? null,
      position: channel.position ?? 0,
      threads: [],
    }));
}

async function fetchDiscordGuildActiveThreads(guildId: string): Promise<GuildChannelNode[]> {
  const headers = botHeaders();
  if (!headers) return [];

  const res = await fetch(`${DISCORD_API}/guilds/${guildId}/threads/active`, {
    headers,
    cache: 'no-store',
  });
  if (!res.ok) return [];

  const payload = (await res.json()) as {
    threads?: Array<{
      id: string;
      name: string;
      type: number;
      parent_id?: string | null;
    }>;
  };

  return (payload.threads ?? [])
    .filter((thread) => [10, 11, 12].includes(thread.type) && thread.parent_id)
    .map((thread) => ({
      id: thread.id,
      name: thread.name,
      type: thread.type,
      parentId: thread.parent_id ?? null,
      position: 0,
      threads: [],
    }));
}

export async function fetchDiscordChannelNode(channelId: string): Promise<GuildChannelNode | null> {
  const headers = botHeaders();
  if (!headers) return null;

  const res = await fetch(`${DISCORD_API}/channels/${channelId}`, {
    headers,
    cache: 'no-store',
  });
  if (!res.ok) return null;

  const channel = (await res.json()) as {
    id: string;
    name?: string;
    type: number;
    parent_id?: string | null;
  };

  return {
    id: channel.id,
    name: channel.name ?? channelId,
    type: channel.type,
    parentId: channel.parent_id ?? null,
    position: 0,
    threads: [],
  };
}

export async function fetchBotAvatarUrl(size = 32) {
  const headers = botHeaders();
  if (!headers) return DEFAULT_BOT_AVATAR;

  const res = await fetch(`${DISCORD_API}/users/@me`, {
    headers,
    next: { revalidate: 3600 },
  });
  if (!res.ok) return DEFAULT_BOT_AVATAR;

  const user = (await res.json()) as { id: string; avatar: string | null };
  if (user.avatar) {
    return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=${size}`;
  }

  const index = Number((BigInt(user.id) >> 22n) % 6n);
  return `https://cdn.discordapp.com/embed/avatars/${index}.png`;
}

export async function fetchDatabaseGuildChannelIds(guildId: string) {
  const { getDatabase } = await import('@/lib/db');
  const db = await getDatabase();
  const guilds = await db.getGuilds();
  return (guilds[String(guildId)]?.channels ?? []).map(String);
}

async function fetchDatabaseGuildChannels(guildId: string): Promise<GuildChannelNode[]> {
  const channelIds = await fetchDatabaseGuildChannelIds(guildId);
  if (!channelIds.length) return [];

  const nodes = await Promise.all(channelIds.map((id) => fetchDiscordChannelNode(id)));
  return nodes.filter((node): node is GuildChannelNode => node !== null);
}

async function fetchGuildChannelNodesUncached(guildId: string) {
  const fromDiscord = await fetchDiscordGuildChannels(guildId);
  if (fromDiscord?.length) {
    const threads = await fetchDiscordGuildActiveThreads(guildId);
    return [...fromDiscord, ...threads];
  }

  const fromDatabase = await fetchDatabaseGuildChannels(guildId);
  if (fromDatabase.length) return fromDatabase;

  if (fromDiscord) return fromDiscord;
  throw new Response('Failed to fetch guild channels', { status: 502 });
}

export async function fetchGuildChannelNodes(guildId: string) {
  return getCached(`discord:channels:${guildId}`, 45_000, () => fetchGuildChannelNodesUncached(guildId));
}

export async function fetchGuildChannels(guildId: string) {
  const nodes = await fetchGuildChannelNodes(guildId);
  return nodes.filter((node) => [0, 5, 15].includes(node.type)).map(({ id, name, type }) => ({ id, name, type }));
}

async function fetchDatabaseGuildIdsUncached() {
  try {
    const { getDatabase } = await import('@/lib/db');
    const db = await getDatabase();
    const guilds = await db.getGuilds();
    return new Set(
      Object.keys(guilds)
        .filter((guildId) => guildId && guildId !== 'null')
        .map(String)
    );
  } catch (error) {
    console.error('[genesis-web] Failed to load guild ids from database:', error);
    return new Set<string>();
  }
}

export async function fetchDatabaseGuildIds() {
  return getCached('db:known-guild-ids', 60_000, fetchDatabaseGuildIdsUncached);
}

/** True when the guild has at least one row in `channels` (Genesis has seen this server). */
export async function isBotInGuild(guildId: string) {
  const status = await checkBotInGuilds([guildId]);
  return status[guildId] ?? false;
}

export async function checkBotInGuilds(guildIds: string[]) {
  if (!guildIds.length) return {} as Record<string, boolean>;

  const knownGuilds = await fetchDatabaseGuildIds();
  return Object.fromEntries(guildIds.map((id) => [id, knownGuilds.has(String(id))])) as Record<string, boolean>;
}

async function fetchGuildRolesUncached(guildId: string) {
  const headers = botHeaders();
  if (!headers) return [];

  const res = await fetch(`${DISCORD_API}/guilds/${guildId}/roles`, {
    headers,
    next: { revalidate: 120 },
  });
  if (!res.ok) {
    throw new Response('Failed to fetch guild roles', { status: res.status });
  }
  const roles = (await res.json()) as Array<{ id: string; name: string }>;
  return roles.map((role) => ({ id: role.id, name: role.name }));
}

export async function fetchGuildRoles(guildId: string) {
  return getCached(`discord:roles:${guildId}`, 120_000, () => fetchGuildRolesUncached(guildId));
}

async function fetchGuildMemberRolesUncached(guildId: string, userId: string) {
  const headers = botHeaders();
  if (!headers) return [] as string[];
  const res = await fetch(`${DISCORD_API}/guilds/${guildId}/members/${userId}`, {
    headers,
    next: { revalidate: 30 },
  });
  if (!res.ok) return [];
  const member = (await res.json()) as { roles?: string[] };
  return member.roles ?? [];
}

export async function fetchGuildMemberRoles(guildId: string, userId: string) {
  return getCached(`discord:member-roles:${guildId}:${userId}`, 30_000, () =>
    fetchGuildMemberRolesUncached(guildId, userId)
  );
}

export async function searchGuildMembers(guildId: string, query: string, limit = 10) {
  const headers = botHeaders();
  const trimmed = query.trim();
  if (!headers || !trimmed) return [] as Array<{ id: string; name: string }>;

  const res = await fetch(
    `${DISCORD_API}/guilds/${guildId}/members/search?query=${encodeURIComponent(trimmed)}&limit=${limit}`,
    { headers, cache: 'no-store' }
  );
  if (!res.ok) return [];

  const members = (await res.json()) as Array<{
    user: { id: string; username: string; global_name?: string | null };
  }>;

  return members.map((member) => ({
    id: member.user.id,
    name: member.user.global_name || member.user.username,
  }));
}

export async function fetchDiscordGuildInfo(guildId: string): Promise<DiscordGuildInfo | DiscordGuildInfoError> {
  const headers = botHeaders();
  if (!headers) return { error: 'Bot token not configured', status: 503 };

  const guildRes = await fetch(`${DISCORD_API}/guilds/${guildId}?with_counts=true`, {
    headers,
    cache: 'no-store',
  });
  if (!guildRes.ok) {
    const message =
      guildRes.status === 404
        ? 'Guild not found or bot is not in this server.'
        : `Discord API error (${guildRes.status})`;
    return { error: message, status: guildRes.status };
  }

  const guild = (await guildRes.json()) as {
    id: string;
    name: string;
    icon: string | null;
    owner_id: string;
    created_at?: string;
    approximate_member_count?: number;
    approximate_presence_count?: number;
    verification_level?: number;
  };

  const [channelsRes, emojisRes, rolesRes] = await Promise.all([
    fetch(`${DISCORD_API}/guilds/${guildId}/channels`, { headers, cache: 'no-store' }),
    fetch(`${DISCORD_API}/guilds/${guildId}/emojis`, { headers, cache: 'no-store' }),
    fetch(`${DISCORD_API}/guilds/${guildId}/roles`, { headers, cache: 'no-store' }),
  ]);

  const channels = channelsRes.ok ? ((await channelsRes.json()) as Array<{ type: number }>) : [];
  const emojis = emojisRes.ok ? ((await emojisRes.json()) as unknown[]) : [];
  const roles = rolesRes.ok ? ((await rolesRes.json()) as unknown[]) : [];

  let registeredChannelIds: string[] = [];
  let inDatabase = false;
  try {
    registeredChannelIds = await fetchDatabaseGuildChannelIds(guildId);
    inDatabase = (await fetchDatabaseGuildIds()).has(String(guildId));
  } catch {
    // Discord lookup still succeeds when DB is unavailable.
  }

  return {
    id: guild.id,
    name: guild.name,
    iconUrl: guild.icon ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png?size=128` : null,
    ownerId: guild.owner_id,
    createdAt: guild.created_at ?? new Date(Number((BigInt(guild.id) >> 22n) + 1420070400000n)).toISOString(),
    memberCount: guild.approximate_member_count ?? null,
    presenceCount: guild.approximate_presence_count ?? null,
    verificationLevel: guild.verification_level ?? 0,
    textChannelCount: channels.filter((channel) => channel.type === 0).length,
    voiceChannelCount: channels.filter((channel) => channel.type === 2).length,
    emojiCount: emojis.length,
    roleCount: roles.length,
    inDatabase,
    registeredChannelCount: registeredChannelIds.length,
  };
}

export async function leaveDiscordGuild(guildId: string): Promise<{ ok: true } | DiscordGuildInfoError> {
  const headers = botHeaders();
  if (!headers) return { error: 'Bot token not configured', status: 503 };

  const res = await fetch(`${DISCORD_API}/users/@me/guilds/${guildId}`, {
    method: 'DELETE',
    headers,
  });

  if (!res.ok) {
    const message =
      res.status === 404 ? 'Guild not found or bot is not in this server.' : `Discord API error (${res.status})`;
    return { error: message, status: res.status };
  }

  return { ok: true };
}

export async function fetchDiscordGuildBanner(guildId: string): Promise<string | null> {
  return getCached(`discord:banner:${guildId}`, 3_600_000, () => fetchDiscordGuildBannerUncached(guildId));
}

async function fetchDiscordGuildBannerUncached(guildId: string): Promise<string | null> {
  const headers = botHeaders();
  if (!headers) return null;

  const res = await fetch(`${DISCORD_API}/guilds/${guildId}`, {
    headers,
    next: { revalidate: 3600 },
  });
  if (!res.ok) return null;

  const guild = (await res.json()) as { banner?: string | null };
  if (!guild.banner) return null;

  const ext = guild.banner.startsWith('a_') ? 'gif' : 'png';
  return `https://cdn.discordapp.com/banners/${guildId}/${guild.banner}.${ext}?size=600`;
}
