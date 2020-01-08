'use strict';

const SQL = require('sql-template-strings');

class RatioQueries {
  constructor(db) {
    this.db = db;
  }

  addStream(type, username, uid) {
    let q;
    if (uid) {
      q = SQL`INSERT IGNORE INTO streams (type, stream_name, uid) (${type}, ${username}, ${uid})`;
    } else {
      q = SQL`INSERT IGNORE INTO streams (type, stream_name) (${type}, ${username})`;
    }
    return this.db.query(q);
  }

  deleteStream(type, uid) {
    const q = SQL`DELETE FROM streams WHERE type = ${type} AND uid = ${uid}`;
    return this.db.query(q);
  }

  async getTrackedStreams(shardIds, type, shardTotal) {
    const q = SQL`SELECT DISTINCT s.stream_name FROM streams as s`
      .append(
        SQL` INNER JOIN type_notifications as types ON types.type LIKE ${`${type}.*`}`,
      )
      .append(SQL` INNER JOIN channels ON channels.id = types.channel_id
          AND MOD(IFNULL(channels.guild_id, 0) >> 22, ${shardTotal}) in (${shardIds})`);

    return (await this.db.query(q))[0];
  }
}

module.exports = RatioQueries;
