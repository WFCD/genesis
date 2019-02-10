'use strict';

const SQL = require('sql-template-strings');

class RatioQueries {
  constructor(db) {
    this.db = db;
  }

  addGuildRatio(shard, guild) {
    if (!shard) return undefined;
    return this.db.query(SQL`INSERT IGNORE INTO guild_ratio (shard_id, guild_id, owner_id) VALUES (${shard.id}, ${guild.id}, ${guild.ownerID});`);
  }

  getGuildRatios(shard) {
    if (!shard) return undefined;
    return this.db.query(SQL`SELECT * FROM guild_ratio WHERE shard_id = ${shard.id};`);
  }

  deleteGuildRatio(guild) {
    return this.db.query(SQL`DELETE FROM guild_ratio WHERE guild_id = ${guild.id};`);
  }
}

module.exports = RatioQueries;
