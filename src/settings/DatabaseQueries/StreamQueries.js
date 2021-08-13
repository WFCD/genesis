'use strict';

const SQL = require('sql-template-strings');

/**
 * Database Mixin for Streams queries
 * @mixin
 * @deprecated
 */
module.exports = class StreamQueries {
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
    return this.query(q);
  }

  deleteStream(type, uid) {
    const q = SQL`DELETE FROM streams WHERE type = ${type} AND uid = ${uid}`;
    return this.query(q);
  }

  async getTrackedStreams(shardIds, type, shardTotal) {
    const q = SQL`SELECT DISTINCT s.stream_name FROM streams as s`
      .append(
        SQL` INNER JOIN type_notifications as types ON types.type LIKE ${`${type}.*`}`,
      )
      .append(SQL` INNER JOIN channels ON channels.id = types.channel_id
          AND MOD(IFNULL(channels.guild_id, 0) >> 22, ${shardTotal}) in (${shardIds})`);

    return (await this.query(q))[0];
  }
};
