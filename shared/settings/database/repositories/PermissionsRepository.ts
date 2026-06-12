import { type Guild, type GuildBasedChannel, type GuildMember, type Role as DiscordRole, type User } from 'discord.js';
import SQL from 'sql-template-strings';

import type { DatabaseDeps } from '#shared/settings/database/DatabaseDeps';

type PermissionResult = boolean | 'none';
type RoleLike = Pick<DiscordRole, 'id'>;
type ChannelRef = Pick<GuildBasedChannel, 'id'> & {
  guild?: Guild;
  isTextBased?: () => boolean;
  isText?: () => boolean;
};
type GuildUserWithRoles = User & {
  roles?: {
    cache?: Map<string, DiscordRole> | { keys?: () => IterableIterator<string> };
  };
};

type PermissionRow = {
  command_id: string;
  allowed: boolean;
  is_user: boolean;
  target_id: string;
};

/**
 * Command permission checks and permission writes for guild/channel scope.
 * Mirrors legacy PermissionsQueries mixin behavior with typed repository APIs.
 */
export default class PermissionsRepository {
  constructor(private readonly deps: DatabaseDeps) {}

  private isTextChannelWithGuild(channel: ChannelRef): channel is ChannelRef & { guild: Guild } {
    if (typeof channel.isTextBased === 'function') {
      return channel.isTextBased() && Boolean(channel.guild);
    }
    if (typeof channel.isText === 'function') {
      return channel.isText() && Boolean(channel.guild);
    }
    return Boolean(channel.guild);
  }

  async setChannelPermissionForMember(
    channel: Pick<ChannelRef, 'id'>,
    member: Pick<GuildMember, 'id'>,
    commandId: string | string[],
    allowed: boolean
  ) {
    if (typeof commandId === 'string') {
      const query = SQL`INSERT INTO channel_permissions VALUES
        (${channel.id}, ${member.id}, TRUE, ${commandId}, ${allowed})
        ON DUPLICATE KEY UPDATE allowed = ${allowed};`;
      return this.deps.query(query);
    }

    const query = SQL`INSERT INTO channel_permissions VALUES `;
    commandId.forEach((command, index) => {
      query
        .append(SQL`(${channel.id}, ${member.id}, TRUE, ${command}, ${allowed})`)
        .append(index !== commandId.length - 1 ? ',' : '');
    });
    query.append(SQL` ON DUPLICATE KEY UPDATE allowed = ${allowed};`);
    return this.deps.query(query);
  }

  async setChannelPermissionForRole(
    channel: Pick<ChannelRef, 'id'>,
    role: RoleLike,
    commandId: string | string[],
    allowed: boolean
  ) {
    if (typeof commandId === 'string') {
      const query = SQL`INSERT INTO channel_permissions VALUES
        (${channel.id}, ${role.id}, FALSE, ${commandId}, ${allowed})
        ON DUPLICATE KEY UPDATE allowed = ${allowed};`;
      return this.deps.query(query);
    }

    const query = SQL`INSERT INTO channel_permissions VALUES `;
    commandId.forEach((command, index) => {
      query
        .append(SQL`(${channel.id}, ${role.id}, FALSE, ${command}, ${allowed})`)
        .append(index !== commandId.length - 1 ? ',' : '');
    });
    query.append(SQL` ON DUPLICATE KEY UPDATE allowed = ${allowed};`);
    return this.deps.query(query);
  }

  async setGuildPermissionForMember(
    guild: Pick<Guild, 'id'>,
    member: Pick<GuildMember, 'id'>,
    commandId: string,
    allowed: boolean
  ) {
    const query = SQL`INSERT INTO guild_permissions VALUES
      (${guild.id}, ${member.id}, TRUE, ${commandId}, ${allowed})
      ON DUPLICATE KEY UPDATE allowed = ${allowed};`;
    return this.deps.query(query);
  }

  async setGuildPermissionForRole(guild: Pick<Guild, 'id'>, role: RoleLike, commandId: string, allowed: boolean) {
    const query = SQL`INSERT INTO guild_permissions VALUES
      (${guild.id}, ${role.id}, FALSE, ${commandId}, ${allowed})
      ON DUPLICATE KEY UPDATE allowed = ${allowed};`;
    return this.deps.query(query);
  }

  async getChannelPermissionForMember(
    channel: Pick<ChannelRef, 'id'>,
    memberId: string,
    commandId: string
  ): Promise<PermissionResult> {
    const query = SQL`SELECT allowed FROM channel_permissions
      WHERE channel_id = ${channel.id} AND command_id = ${commandId}
      AND is_user = true AND target_id = ${memberId}`;
    const [rows] = (await this.deps.query(query)) ?? [[]];
    if (!rows.length) {
      return 'none';
    }
    return rows[0].allowed;
  }

  async getChannelPermissionForRole(
    channel: Pick<ChannelRef, 'id'>,
    role: RoleLike,
    commandId: string
  ): Promise<PermissionResult> {
    const query = SQL`SELECT allowed FROM channel_permissions
      WHERE channel_id = ${channel.id} AND command_id = ${commandId}
      AND is_user = false AND target_id = ${role.id}`;
    const [rows] = (await this.deps.query(query)) ?? [[]];
    if (!rows.length) {
      return 'none';
    }
    return rows[0].allowed;
  }

  async getChannelPermissionForUserRoles(
    channel: ChannelRef,
    user: GuildUserWithRoles,
    commandId: string
  ): Promise<PermissionResult> {
    const userRoles = this.isTextChannelWithGuild(channel) ? user?.roles?.cache : undefined;
    const userRoleIds = Array.from(userRoles?.keys?.() ?? []);
    if (!userRoleIds.length) {
      return 'none';
    }

    const query = SQL`SELECT target_id, is_user, allowed
        FROM channel_permissions
        WHERE channel_permissions.channel_id = ${channel.id}
          AND channel_permissions.target_id IN (${userRoleIds})
          AND command_id = ${commandId}
        UNION SELECT guild_permissions.target_id AS target_id,
             guild_permissions.is_user AS is_user,
             guild_permissions.allowed AS allowed
        FROM guild_permissions
        INNER JOIN channels USING (guild_id)
        LEFT JOIN channel_permissions ON
          channel_permissions.channel_id = channels.id
          AND guild_permissions.command_id = channel_permissions.command_id
          AND guild_permissions.target_id = channel_permissions.target_id
        WHERE channel_permissions.target_id IS NULL
          AND channels.id = ${channel.id}
          AND guild_permissions.target_id IN (${userRoleIds});`;
    const [rows] = (await this.deps.query(query)) ?? [[]];
    if (!rows.length) {
      return 'none';
    }

    const orderedRows = [...(rows as PermissionRow[])].sort((a, b) => {
      if (!this.isTextChannelWithGuild(channel)) {
        return 0;
      }
      const roleA = channel.guild.roles.cache.get(a.target_id);
      const roleB = channel.guild.roles.cache.get(b.target_id);
      if (!roleA || !roleB) {
        return 0;
      }
      return roleB.comparePositionTo(roleA);
    });

    return orderedRows[0]?.allowed ?? 'none';
  }

  async getGuildPermissionForMember(guild: Pick<Guild, 'id'>, memberId: string, commandId: string): Promise<boolean> {
    const query = SQL`SELECT allowed FROM guild_permissions
      WHERE guild_id = ${guild.id} AND command_id = ${commandId}
      AND is_user = true AND target_id = ${memberId}`;
    const [rows] = (await this.deps.query(query)) ?? [[]];
    if (!rows.length) {
      throw new Error(
        `The guild permissions for the guild ${guild.id} for member ${memberId} was not found in the database`
      );
    }
    return rows[0].allowed;
  }

  async getGuildPermissionForRole(guild: Pick<Guild, 'id'>, role: RoleLike, commandId: string): Promise<boolean> {
    const query = SQL`SELECT allowed FROM guild_permissions
      WHERE guild_id = ${guild.id} AND command_id = ${commandId}
      AND is_user = false AND target_id = ${role.id}`;
    const [rows] = (await this.deps.query(query)) ?? [[]];
    if (!rows.length) {
      throw new Error(
        `The guild permissions for the guild ${guild.id} for member ${role.id} was not found in the database`
      );
    }
    return rows[0].allowed;
  }

  async removeGuildPermissions(guildId: string) {
    const query = SQL`DELETE FROM guild_permissions WHERE guild_id = ${guildId}`;
    return this.deps.query(query);
  }

  async removeChannelPermissions(channelId: string) {
    const query = SQL`DELETE FROM channel_permissions WHERE channel_id = ${channelId}`;
    return this.deps.query(query);
  }

  async permissionsForGuild(guild: Pick<Guild, 'id'>) {
    const query = SQL`SELECT * FROM guild_permissions WHERE guild_id = ${guild.id}`;
    const [rows] = (await this.deps.query(query)) ?? [[]];
    if (!rows.length) {
      return [];
    }
    return (rows as PermissionRow[]).map((value) => ({
      level: 'guild',
      command: value.command_id,
      isAllowed: value.allowed,
      type: value.is_user ? 'user' : 'role',
      appliesToId: value.target_id,
    }));
  }

  async permissionsForChannel(channel: Pick<ChannelRef, 'id'>) {
    const query = SQL`SELECT * FROM channel_permissions WHERE channel_id = ${channel.id}`;
    const [rows] = (await this.deps.query(query)) ?? [[]];
    if (!rows.length) {
      return [];
    }
    return (rows as PermissionRow[]).map((value) => ({
      level: 'channel',
      command: value.command_id,
      isAllowed: value.allowed,
      type: value.is_user ? 'user' : 'role',
      appliesToId: value.target_id,
    }));
  }
}
