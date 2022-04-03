import SQL from 'sql-template-strings';

/**
 * Database Mixin for guild ratio queries
 * @mixin
 * @mixes Database
 */
export default class RatioQueries {
  addGuildRatio(shard, guild) {
    if (!shard) return undefined;
    return this.query(
      SQL`INSERT IGNORE INTO guild_ratio (shard_id, guild_id, owner_id) VALUES (${shard.id}, ${guild.id}, ${guild.ownerID});`
    );
  }

  getGuildRatios(shards) {
    if (!shards || !shards.length) return undefined;
    return this.query(SQL`SELECT * FROM guild_ratio WHERE shard_id in (${shards});`);
  }

  deleteGuildRatio(guild) {
    return this.query(SQL`DELETE FROM guild_ratio WHERE guild_id = ${guild.id};`);
  }
}
