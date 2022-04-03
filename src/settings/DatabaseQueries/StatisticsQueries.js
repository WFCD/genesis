import SQL from 'sql-template-strings';
// eslint-disable-next-line no-unused-vars
import Discord from 'discord.js';

/**
 * Database Mixin for role statistics queries
 * @mixin
 * @mixes Database
 */
export default class StatisticsQueries {
  /**
   * Track a role in a guild
   * @param {Discord.Guild} guild guild to track in
   * @param {Discord.VoiceChannel} channel voice channel to use for tracking
   * @param {Discord.Role} role to track
   * @returns {Promise<mysql.Connection.query>}
   */
  async trackRole(guild, channel, role) {
    return this.query(SQL`
      INSERT IGNORE INTO role_stats
      (guild_id, channel_id, role_id)
      VALUES (${guild.id}, ${channel.id}, ${role.id})
    `);
  }

  /**
   * Untrack a role in a guild
   * @param {Discord.Guild} guild to untrack from
   * @param {Discord.Role} role to untrack
   * @returns {Promise<mysql.Connection.query>}
   */
  async untrackRole(guild, role) {
    return this.query(SQL`
      DELETE FROM role_stats
      WHERE guild_id = ${guild.id}
        AND role_id = ${role.id}
    `);
  }

  /**
   * Get all tracked roles in a guild
   * @param {Discord.Guild} guild to pull tracked roles from
   * @returns {Promise<{}>}
   */
  async getTrackedRoles(guild) {
    const q = SQL`SELECT role_id, channel_id FROM role_stats WHERE guild_id = ${guild.id}`;
    const map = {};
    const res = (await this.query(q))[0];
    res.forEach(({ role_id: roleId, channel_id: channelId }) => {
      map[roleId] = channelId;
    });
    return map;
  }

  /**
   * Add an execution of given command id to stats for the guild
   *  in the format command:sub_group?:sub_command
   * @param {Discord.Guild} guild to increment count in
   * @param {string} commandId command id with format command:sub_group?:sub_command
   * @returns {Promise<*>}
   */
  async addExecution(guild, commandId) {
    const query = SQL`INSERT IGNORE
      INTO command_stats
      VALUES (${guild.id}, ${commandId}, 1)
      ON DUPLICATE KEY UPDATE count=count+1;`;
    return this.query(query);
  }

  /**
   * Get Guild statistics, filtered to a single command if needed
   * @param {Discord.Guild} guild to fetch stats for
   * @param {string} [commandId] command to get stats for
   * @param {boolean} [global] whether or not to pull stats from all guilds
   * @returns {Promise<void>}
   */
  async getGuildStats(guild, commandId, global = false) {
    let query;
    if (commandId) {
      if (global) {
        return (
          await this.query(
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
    return (await this.query(query))?.[0]?.map((r) => ({
      id: r.command_id,
      count: r.count,
    }));
  }
}
