import type { User } from 'discord.js';
import SQL from 'sql-template-strings';

import type { DatabaseDeps } from '../DatabaseDeps';

export interface BlacklistDeps extends DatabaseDeps {
  bot?: {
    client?: {
      users: { cache: { get(id: string): User | undefined } };
    };
  };
}

/**
 * User blacklist rows (guild + global scopes).
 * Mirrors legacy blacklist mixin behavior.
 */
export default class BlacklistRepository {
  constructor(private readonly deps: BlacklistDeps) {}

  async isBlacklisted(userId: string, guildId: string) {
    const query = SQL`SELECT COUNT(*) > 0 AS is_blacklisted
      FROM user_blacklist
      WHERE user_id = ${userId}
        AND (guild_id = ${guildId} OR is_global = true);`;
    const [rows] = (await this.deps.query(query)) ?? [[]];
    const row = rows[0] as { is_blacklisted?: string | number | boolean } | undefined;
    return row ? row.is_blacklisted === '1' || row.is_blacklisted === 1 || row.is_blacklisted === true : false;
  }

  async getBlacklisted(guildId: string, global: boolean): Promise<User[]> {
    const query = SQL`SELECT user_id
      FROM user_blacklist
      WHERE guild_id = ${guildId}
        AND is_global = ${global};`;
    const [rows] = (await this.deps.query(query)) ?? [[]];
    return (rows as Array<{ user_id: string }>)
      .map((result) => this.deps.bot?.client?.users.cache.get(result.user_id))
      .filter((user): user is User => Boolean(user));
  }

  async addBlacklistedUser(userId: string, guildId: string | number, global: boolean) {
    const query = SQL`INSERT IGNORE INTO user_blacklist
      VALUES (${userId}, ${guildId || 0}, ${global});`;
    return this.deps.query(query);
  }

  async deleteBlacklistedUser(userId: string, guildId: string, global: boolean) {
    const query = SQL`DELETE IGNORE FROM user_blacklist
      WHERE user_id = ${userId}
        AND is_global = ${global}
        AND guild_id = ${guildId};`;
    return this.deps.query(query);
  }
}
