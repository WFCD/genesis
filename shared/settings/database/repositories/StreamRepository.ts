import SQL from 'sql-template-strings';

import type { DatabaseDeps } from '#shared/settings/database/DatabaseDeps';

export type TrackedStreamRow = {
  stream_name: string;
};

/**
 * External stream watch list + notification join query.
 * Mirrors deprecated stream mixin behavior.
 */
export default class StreamRepository {
  constructor(private readonly deps: DatabaseDeps) {}

  addStream(type: string, username: string, uid?: string) {
    let query;
    if (uid) {
      query = SQL`INSERT IGNORE INTO streams (type, stream_name, uid) VALUES (${type}, ${username}, ${uid})`;
    } else {
      query = SQL`INSERT IGNORE INTO streams (type, stream_name) VALUES (${type}, ${username})`;
    }
    return this.deps.query(query);
  }

  deleteStream(type: string, uid: string) {
    const query = SQL`DELETE FROM streams WHERE type = ${type} AND uid = ${uid}`;
    return this.deps.query(query);
  }

  async getTrackedStreams(shardIds: Array<string | number>, type: string, shardTotal: number) {
    const query = SQL`SELECT DISTINCT s.stream_name FROM streams as s`.append(
      SQL` INNER JOIN type_notifications as types ON types.type LIKE ${`${type}.*`}`
    ).append(SQL` INNER JOIN channels ON channels.id = types.channel_id
          AND MOD(IFNULL(channels.guild_id, 0) >> 22, ${shardTotal}) in (${shardIds})`);

    const [rows] = (await this.deps.query(query)) ?? [[]];
    return rows as TrackedStreamRow[];
  }
}
