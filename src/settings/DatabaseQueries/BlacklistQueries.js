'use strict';

const SQL = require('sql-template-strings');

class BlacklistQueries {
  constructor(db) {
    this.db = db;
  }

  async isBlacklisted(userId, guildId) {
    const query = SQL`SELECT COUNT(*) > 0 AS is_blacklisted
      FROM user_blacklist WHERE user_id = ${userId}
        AND (guild_id = ${guildId} OR is_global = true);`
    const res = await this.db.query(query);
    if (res[0]) {
      return res[0][0].is_blacklisted;
    }
    return false;
  }
}

module.exports = BlacklistQueries;
