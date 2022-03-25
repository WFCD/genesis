import SQL from 'sql-template-strings';

/**
 * Database Mixin for Blacklist queries
 * @mixin
 */
export default class BlacklistQueries {
  async isBlacklisted(userId, guildId) {
    const query = SQL`SELECT COUNT(*) > 0 AS is_blacklisted
      FROM user_blacklist WHERE user_id = ${userId}
        AND (guild_id = ${guildId} OR is_global = true);`;
    const rows = await this.query(query);
    if (rows) {
      return rows[0].is_blacklisted === '1';
    }
    return false;
  }

  /**
   * Get blacklisted users
   * @param  {string}  guildId Guild to get data
   * @param  {boolean}  global  whether or not it's global
   * @returns {Promise}
   */
  async getBlacklisted(guildId, global) {
    const query = `SELECT user_id
      FROM user_blacklist
      WHERE guild_id = ${guildId}
        AND is_global = ${global};`;
    const [rows] = await this.query(query);
    if (rows) {
      return rows
        .map(result => this.bot.client.users.cache.get(result.user_id))
        .filter(user => user);
    }
    return [];
  }

  /**
   * Add a blacklisted user
   * @param  {Snowflake}  userId  User id to blacklist
   * @param  {Snowflake}  guildId Guild id or 0 from which to blacklist
   * @param  {boolean}  global  If this is a global blacklist
   * @returns {Promise}
   */
  async addBlacklistedUser(userId, guildId, global) {
    const query = SQL`INSERT IGNORE INTO user_blacklist
      VALUES (${userId}, ${guildId || 0}, ${global});`;
    return this.query(query);
  }

  /**
   * Remove a blacklisted user
   * @param  {string}  userId  User's id
   * @param  {string}  guildId Guild id
   * @param  {boolean}  global  whether or not to show globals
   * @returns {Promise}
   */
  async deleteBlacklistedUser(userId, guildId, global) {
    const query = SQL`DELETE IGNORE FROM user_blacklist
      WHERE user_id = ${userId}
        AND is_global = ${global}
        AND guild_id = ${guildId};`;
    return this.query(query);
  }
}
