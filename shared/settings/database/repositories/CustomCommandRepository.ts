import SQL from 'sql-template-strings';

import type { DatabaseDeps } from '../DatabaseDeps';

type GuildRef = { id: string };

export type CustomCommandData = {
  guildId?: string;
  call: string;
  response: string;
  id?: string;
  ephemeral?: boolean;
};

/**
 * Custom command CRUD for guild interaction domain.
 * Mirrors legacy `CustomCommandQueries` mixin behavior.
 */
export default class CustomCommandRepository {
  constructor(private readonly deps: DatabaseDeps) {}

  async getRawCustomCommands(guildId?: string): Promise<CustomCommandData[]> {
    const query = guildId
      ? SQL`SELECT * FROM custom_commands where guild_id = ${guildId};`
      : SQL`SELECT * FROM custom_commands;`;

    const [rows] = (await this.deps.query(query)) ?? [[]];
    if (!rows?.length) return [];
    return (rows as Array<{ command: string; response: string; guild_id: string; ephemeral?: number }>).map((row) => {
      try {
        return {
          call: row.command,
          response: decodeURIComponent(row.response),
          guildId: row.guild_id,
          ephemeral: Boolean(row.ephemeral),
        };
      } catch {
        return {
          call: row.command,
          response: row.response,
          guildId: row.guild_id,
          ephemeral: Boolean(row.ephemeral),
        };
      }
    });
  }

  async getCustomCommandRaw(guild: GuildRef, call: string): Promise<CustomCommandData | undefined> {
    const id = `${call}${guild.id}`;
    const query = SQL`SELECT * FROM custom_commands WHERE guild_id = ${guild.id} AND command_id = ${id}`;

    const [rows] = (await this.deps.query(query)) ?? [[]];
    if (rows) {
      const vals = (rows as Array<{ command: string; response: string; command_id: string; ephemeral?: number }>).map(
        (row) => ({
          call: row.command,
          response: row.response,
          id: row.command_id,
          ephemeral: Boolean(row.ephemeral),
        })
      );
      this.deps.logger?.warn(JSON.stringify(vals));
      return vals[0];
    }
    return undefined;
  }

  async updateCustomCommand(
    guild: GuildRef,
    call: string,
    patch: { response?: string; ephemeral?: boolean }
  ): Promise<boolean> {
    const existing = await this.getCustomCommandRaw(guild, call);
    if (!existing?.id) return false;

    const response = patch.response ?? existing.response;
    const ephemeral = patch.ephemeral ?? existing.ephemeral ?? false;

    await this.deps.query(SQL`
      UPDATE custom_commands
      SET response = ${response},
        ephemeral = ${ephemeral ? 1 : 0}
      WHERE guild_id = ${guild.id}
        AND command_id = ${existing.id}
    `);
    return true;
  }

  async getCustomCommandsForGuild(
    guild: GuildRef
  ): Promise<Array<Pick<CustomCommandData, 'call' | 'response' | 'ephemeral'>>> {
    const query = SQL`SELECT * FROM custom_commands WHERE guild_id = ${guild.id}`;
    const [rows] = (await this.deps.query(query)) ?? [[]];
    if (rows) {
      return (rows as Array<{ command: string; response: string; ephemeral?: number }>).map((row) => ({
        call: row.command,
        response: row.response,
        ephemeral: Boolean(row.ephemeral),
      }));
    }
    return [];
  }

  async addCustomCommand(guild: GuildRef, call: string, response: string, creator: string, ephemeral = false) {
    const id = `${call}${guild.id}`;
    const query = SQL`INSERT INTO custom_commands (command_id, guild_id, command, response, creator_id, ephemeral)
      VALUES (${id}, ${guild.id}, ${call}, ${response}, ${creator}, ${ephemeral ? 1 : 0})`;
    return this.deps.query(query);
  }

  async deleteCustomCommand(guild: GuildRef, call: string) {
    const id = `${call}${guild.id}`;
    const query = SQL`DELETE FROM custom_commands WHERE command_id = ${id}`;
    return this.deps.query(query);
  }

  async removeGuildCustomCommands(guildId: string) {
    const query = SQL`DELETE FROM custom_commands WHERE guild_id = ${guildId}`;
    return this.deps.query(query);
  }
}
