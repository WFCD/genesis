import type { Guild, Role, VoiceChannel } from 'discord.js';
import SQL from 'sql-template-strings';

import type { DatabaseDeps } from '../DatabaseDeps';

type GuildRef = Pick<Guild, 'id'>;
type RoleRef = Pick<Role, 'id'>;
type VoiceChannelRef = Pick<VoiceChannel, 'id'>;

/**
 * Command execution and tracked-role statistics persistence.
 * Mirrors legacy StatisticsQueries mixin behavior.
 */
export default class StatisticsRepository {
  constructor(private readonly deps: DatabaseDeps) {}

  async trackRole(guild: GuildRef, channel: VoiceChannelRef, role: RoleRef) {
    return this.deps.query(SQL`
      INSERT IGNORE INTO role_stats
      (guild_id, channel_id, role_id)
      VALUES (${guild.id}, ${channel.id}, ${role.id})
    `);
  }

  async untrackRole(guild: GuildRef, role: RoleRef) {
    return this.deps.query(SQL`
      DELETE FROM role_stats
      WHERE guild_id = ${guild.id}
        AND role_id = ${role.id}
    `);
  }

  async getTrackedRoles(guild: GuildRef): Promise<Record<string, string>> {
    const q = SQL`SELECT role_id, channel_id FROM role_stats WHERE guild_id = ${guild.id}`;
    const map: Record<string, string> = {};
    const [rows] = (await this.deps.query(q)) ?? [[]];
    (rows as Array<{ role_id: string; channel_id: string }>).forEach(({ role_id: roleId, channel_id: channelId }) => {
      map[roleId] = channelId;
    });
    return map;
  }

  async addExecution(guild: GuildRef, commandId: string) {
    const query = SQL`INSERT IGNORE
      INTO command_stats
      VALUES (${guild.id}, ${commandId}, 1)
      ON DUPLICATE KEY UPDATE count=count+1;`;
    return this.deps.query(query);
  }

  async getGuildStats(guild: GuildRef, commandId?: string, global = false) {
    let query;
    if (commandId) {
      if (global) {
        return (
          await this.deps.query(
            SQL`SELECT sum(count) as cnt
            FROM command_stats
            WHERE command_id=${commandId}
            GROUP BY command_id;`
          )
        )?.[0]?.[0]?.cnt;
      }
      query = SQL`SELECT command_id, count
        FROM command_stats
        WHERE guild_id=${guild.id} and command_id=${commandId}
        ORDER BY count DESC`;
    } else {
      query = SQL`SELECT command_id, count
        FROM command_stats
        WHERE guild_id=${guild.id}
        ORDER BY count DESC`;
    }
    const [rows] = (await this.deps.query(query)) ?? [[]];
    return (rows as { command_id: string; count: number }[]).map((r) => ({
      id: r.command_id,
      count: r.count,
    }));
  }
}
