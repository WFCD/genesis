import type { CategoryChannel, Guild, GuildMember, TextChannel, VoiceChannel } from 'discord.js';
import SQL from 'sql-template-strings';

import JoinableRole from '#shared/models/JoinableRole';

import type { DatabaseDeps } from '../DatabaseDeps';

export type PrivateRoom = {
  guild?: Guild;
  textChannel?: TextChannel;
  voiceChannel?: VoiceChannel;
  category?: CategoryChannel;
  createdAt?: unknown;
  guildId?: string;
  textId?: string;
  voiceId?: string;
  categoryId?: string;
};

export interface PrivateRoomDeps extends DatabaseDeps {
  bot?: {
    client?: {
      guilds: { cache: { get(id: string): Guild | undefined } };
      channels: { cache: { get(id: string): unknown } };
    };
    shardCount?: number;
  };
}

type GuildRef = Guild | { id: string };

/**
 * User-created private voice/text room records.
 * Mirrors the `rooms` slash command domain.
 */
export default class PrivateRoomRepository {
  constructor(private readonly deps: PrivateRoomDeps) {}

  async removePrivateChannels(guild: GuildRef | string) {
    const guildId = typeof guild === 'string' ? guild : guild.id;
    const query = SQL`DELETE FROM private_channels WHERE guild_id=${guildId}`;
    return this.deps.query(query);
  }

  async setRolesForGuild(guild: GuildRef, roles: string[]) {
    const query = SQL`INSERT INTO guild_joinable_roles VALUES
      (${guild.id}, JSON_ARRAY(${roles}))
      ON DUPLICATE KEY UPDATE id_list = JSON_ARRAY(${roles});`;
    return this.deps.query(query);
  }

  async getRolesForGuild(guild: Guild) {
    const query = SQL`SELECT id_list
      FROM guild_joinable_roles
      WHERE guild_id=${guild.id}`;
    const [rows] = (await this.deps.query(query)) ?? [[]];
    if (rows.length) {
      const rawList = typeof rows[0].id_list === 'string' ? JSON.parse(rows[0].id_list as string) : rows[0].id_list;
      return rawList
        .filter((role: string) => {
          if (!role) {
            return undefined;
          }
          const parsed = JSON.parse(role);
          if (typeof parsed === 'object') {
            return typeof guild.roles.cache.has(parsed.id);
          }
          if (typeof parsed === 'number') {
            return guild.roles.cache.has(String(parsed));
          }
          return undefined;
        })
        .filter((role: string) => role)
        .map((role: string) => {
          const parsed = JSON.parse(role);
          if (typeof parsed === 'object' && guild.roles.cache.has(parsed.id)) {
            const joinable = new JoinableRole(guild.roles.cache.get(parsed.id)!);
            if (typeof parsed.requiredRole !== 'undefined') {
              joinable.requiredRole = guild.roles.cache.has(parsed.requiredRole)
                ? guild.roles.cache.get(parsed.requiredRole)
                : undefined;
            }
            joinable.isLeaveable = typeof parsed.leaveable !== 'undefined' ? parsed.leavable : true;
            return joinable;
          }
          if (typeof parsed === 'string' && guild.roles.cache.has(parsed)) {
            const joinable = new JoinableRole(guild.roles.cache.get(parsed)!);
            joinable.requiredRole = undefined;
            joinable.isLeaveable = true;
            return joinable;
          }
          return undefined;
        })
        .filter((role: JoinableRole | undefined) => role);
    }
    return [];
  }

  async addPrivateRoom(
    guild: GuildRef,
    textChannel: { id: string } | null | undefined,
    voiceChannel: { id: string },
    category: { id: string | number },
    member: GuildMember | { id: string }
  ) {
    let query;
    if (textChannel) {
      query = SQL`INSERT INTO private_channels (guild_id, text_id, voice_id, category_id, created_by) VALUES (${guild.id}, ${textChannel.id}, ${voiceChannel.id}, ${category.id}, ${member.id})`;
    } else {
      query = SQL`INSERT INTO private_channels (guild_id, text_id, voice_id, category_id, created_by) VALUES (${guild.id}, 0, ${voiceChannel.id}, ${category.id}, ${member.id})`;
    }
    return this.deps.query(query);
  }

  async deletePrivateRoom(room: {
    guild?: GuildRef | { id: string };
    guildId?: string;
    voiceChannel?: { id: string };
    voiceId?: string;
    textChannel?: unknown;
    category?: unknown;
  }) {
    const guild = room.guild ?? { id: room.guildId! };
    const { voiceChannel, voiceId } = room;
    const query = SQL`DELETE FROM private_channels WHERE guild_id = ${guild.id} AND voice_id = ${
      voiceChannel ? voiceChannel.id : voiceId
    }`;
    return this.deps.query(query);
  }

  async userHasRoom(member: GuildMember) {
    const query = SQL`SELECT *
      FROM private_channels
      WHERE guild_id = ${member.guild.id}
        and created_by = ${member.id}`;
    const [rows] = (await this.deps.query(query)) ?? [[]];
    return rows.length;
  }

  async getUsersRoom(member: GuildMember): Promise<PrivateRoom | undefined> {
    const query = SQL`SELECT guild_id, text_id, voice_id, category_id, created_at as crt_sec  FROM private_channels WHERE guild_id = ${member.guild.id} and created_by = ${member.id}`;
    const [rows] = (await this.deps.query(query)) ?? [[]];
    if (rows?.length) {
      const row = rows[0] as {
        guild_id: string;
        text_id?: string;
        voice_id: string;
        category_id: string;
        crt_sec: unknown;
      };
      return {
        guild: this.deps.bot?.client?.guilds.cache.get(row.guild_id),
        textChannel: row.text_id
          ? (this.deps.bot?.client?.channels.cache.get(row.text_id) as TextChannel | undefined)
          : undefined,
        voiceChannel: this.deps.bot?.client?.channels.cache.get(row.voice_id) as VoiceChannel | undefined,
        category: this.deps.bot?.client?.channels.cache.get(row.category_id) as CategoryChannel | undefined,
        createdAt: row.crt_sec,
        guildId: row.guild_id,
        textId: row.text_id || undefined,
        voiceId: row.voice_id,
        categoryId: row.category_id,
      };
    }
    return undefined;
  }

  async isPrivateRoom(channel: VoiceChannel) {
    const query = SQL`
      SELECT *
      FROM private_channels
      WHERE guild_id = ${channel.guild.id}
        AND voice_id = ${channel.id}`;
    const [rows] = (await this.deps.query(query)) ?? [[]];
    return rows?.length;
  }

  async getPrivateRooms(shards?: number[]) {
    const query = SQL`
      SELECT guild_id, text_id, voice_id, category_id, created_at as crt_sec
      FROM private_channels
      WHERE MOD(IFNULL(guild_id, 0) >> 22, ${this.deps.bot?.shardCount}) in (${shards})`;
    const [rows] = (await this.deps.query(query)) ?? [[]];
    if (rows) {
      return (
        rows as Array<{
          guild_id: string;
          text_id?: string;
          voice_id: string;
          category_id: string;
          crt_sec: unknown;
        }>
      ).map((value) => ({
        guild: this.deps.bot?.client?.guilds.cache.get(value.guild_id),
        textChannel: value.text_id ? this.deps.bot?.client?.channels.cache.get(value.text_id) : undefined,
        voiceChannel: this.deps.bot?.client?.channels.cache.get(value.voice_id),
        category: this.deps.bot?.client?.channels.cache.get(value.category_id),
        createdAt: value.crt_sec,
        guildId: value.guild_id,
        textId: value.text_id || undefined,
        voiceId: value.voice_id,
        categoryId: value.category_id,
      }));
    }
    return [];
  }
}
