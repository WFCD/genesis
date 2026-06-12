import SQL from 'sql-template-strings';

import type { DatabaseDeps } from '#shared/settings/database/DatabaseDeps';

type ShardRef = { id: string | number } | null | undefined;
type GuildRef = { id: string; ownerId: string };

export type GuildRatioRow = {
  shard_id: string;
  guild_id: string;
  owner_id: string;
};

/**
 * Guild ownership/shard assignment snapshots.
 * Mirrors ratio mixin methods.
 */
export default class RatioRepository {
  constructor(private readonly deps: DatabaseDeps) {}

  addGuildRatio(shard: ShardRef, guild: GuildRef) {
    if (!shard) {
      return undefined;
    }
    return this.deps.query(
      SQL`INSERT IGNORE INTO guild_ratio (shard_id, guild_id, owner_id) VALUES (${shard.id}, ${guild.id}, ${guild.ownerId});`
    );
  }

  getGuildRatios(shards?: Array<string | number>) {
    if (!shards?.length) {
      return undefined;
    }
    return this.deps.query(SQL`SELECT * FROM guild_ratio WHERE shard_id in (${shards});`);
  }

  deleteGuildRatio(guild: Pick<GuildRef, 'id'>) {
    return this.deps.query(SQL`DELETE FROM guild_ratio WHERE guild_id = ${guild.id};`);
  }
}
