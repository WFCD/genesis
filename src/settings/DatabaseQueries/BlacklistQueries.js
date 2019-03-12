'use strict';

const SQL = require('sql-template-strings');

class BlacklistQueries {
  constructor(db) {
    this.db = db;
  }

  async isBlacklisted(userId, guildId) {
    const query = SQL`SELECT COUNT(*) > 0 AS is_blacklisted
      FROM user_blacklist WHERE user_id = ${userId}
        AND (guild_id = ${guildId} OR is_global = true);`;
    const res = await this.db.query(query);
    if (res[0]) {
      return res[0][0].is_blacklisted === '1';
    }
    return false;
  }

  /**
   * Get blacklisted users
   * @param  {string}  guildId Guild to get data
   * @param  {boolean}  global  whether or not it's global
   * @return {Promise}
   */
  async getBlacklisted(guildId, global) {
    const query = `SELECT user_id
      FROM user_blacklist
      WHERE guild_id = ${guildId}
        AND is_global = ${global};`;
    const res = await this.db.query(query);
    console.log(res[0]);
    if (res[0]) {
      return res[0]
        .map(result => this.bot.client.users.get(result.user_id))
        .filter(user => user);
    }
    return [];
  }

  /**
   * Add a blacklisted user
   * @param  {snowflake}  userId  User id to blacklist
   * @param  {snowflake}  guildId Guild id or 0 frpom which to blacklist
   * @param  {boolean}  global  If this is a global blacklist
   * @returns {Promise}
   */
  async addBlacklistedUser(userId, guildId, global) {
    const query = SQL`INSERT IGNORE INTO user_blacklist
      VALUES (${userId}, ${guildId || 0}, ${global});`;
    return this.db.query(query);
  }

  /**
   * Remove a blacklisted user
   * @param  {string}  userId  User's id
   * @param  {string}  guildId Guild id
   * @param  {boolean}  global  whether or not to show globals
   * @return {Promise}
   */
  async deleteBlacklistedUser(userId, guildId, global) {
    const query = SQL`DELETE IGNORE FROM user_blacklist
      WHERE user_id = ${userId}
        AND is_global = ${global}
        AND guild_id = ${guildId};`;
    return this.db.query(query);
  }
}

module.exports = BlacklistQueries;
