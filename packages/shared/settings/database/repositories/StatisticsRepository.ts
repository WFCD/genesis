import type { Guild, Role, VoiceChannel } from 'discord.js';
import SQL from 'sql-template-strings';

import type { DatabaseDeps } from '#shared/settings/database/DatabaseDeps';

type GuildRef = Pick<Guild, 'id'>;
type RoleRef = Pick<Role, 'id'>;
type VoiceChannelRef = Pick<VoiceChannel, 'id'>;

type CommandStatRow = {
  command_id?: string;
  usage_count?: number | string;
  count?: number | string;
};

function readRowValue(row: CommandStatRow, keys: Array<keyof CommandStatRow>) {
  for (const key of keys) {
    const value = row[key];
    if (value !== undefined && value !== null && value !== '') return value;
  }
  return undefined;
}

function mapCommandStatRows(rows: CommandStatRow[]) {
  return rows
    .map((row) => ({
      id: String(readRowValue(row, ['command_id']) ?? ''),
      count: Number(readRowValue(row, ['usage_count', 'count']) ?? 0) || 0,
    }))
    .filter((row) => row.id);
}

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
    const query = SQL`INSERT INTO command_stats (guild_id, command_id, \`count\`)
      VALUES (${String(guild.id)}, ${commandId}, 1)
      ON DUPLICATE KEY UPDATE \`count\`=\`count\`+1;`;
    return this.deps.query(query);
  }

  async getGuildStats(guild: GuildRef, commandId?: string, global = false) {
    const guildId = String(guild.id);

    if (commandId) {
      if (global) {
        return (
          await this.deps.query(
            SQL`SELECT sum(\`count\`) as cnt
            FROM command_stats
            WHERE command_id=${commandId}
            GROUP BY command_id;`
          )
        )?.[0]?.[0]?.cnt;
      }

      const query = SQL`SELECT command_id, \`count\` AS usage_count
        FROM command_stats
        WHERE guild_id=${guildId} and command_id=${commandId}
        ORDER BY \`count\` DESC`;

      const [rows] = (await this.deps.query(query)) ?? [[]];
      return mapCommandStatRows(rows as CommandStatRow[]);
    }

    const query = SQL`SELECT command_id, \`count\` AS usage_count
      FROM command_stats
      WHERE guild_id=${guildId}
      ORDER BY \`count\` DESC`;

    const [rows] = (await this.deps.query(query)) ?? [[]];
    return mapCommandStatRows(rows as CommandStatRow[]);
  }
}
