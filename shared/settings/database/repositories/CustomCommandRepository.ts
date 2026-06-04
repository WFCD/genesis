import SQL from 'sql-template-strings';

import type { DatabaseDeps } from '../DatabaseDeps';

type GuildRef = { id: string };

export type CustomCommandData = {
  guildId?: string;
  call: string;
  response: string;
  id?: string;
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
    return (rows as Array<{ command: string; response: string; guild_id: string }>).map((row) => {
      try {
        return {
          call: row.command,
          response: decodeURIComponent(row.response),
          guildId: row.guild_id,
        };
      } catch {
        return {
          call: row.command,
          response: row.response,
          guildId: row.guild_id,
        };
      }
    });
  }

  async getCustomCommandRaw(guild: GuildRef, call: string): Promise<CustomCommandData | undefined> {
    const id = `${call}${guild.id}`;
    const query = SQL`SELECT * FROM custom_commands WHERE guild_id = ${guild.id} AND command_id = ${id}`;

    const [rows] = (await this.deps.query(query)) ?? [[]];
    if (rows) {
      const vals = (rows as Array<{ command: string; response: string; command_id: string }>).map((row) => ({
        call: row.command,
        response: row.response,
        id: row.command_id,
      }));
      this.deps.logger?.warn(JSON.stringify(vals));
      return vals[0];
    }
    return undefined;
  }

  async updateCustomCommand(guild: GuildRef, { call, response, id }: CustomCommandData) {
    const newId = `${call}${guild.id}`;
    return this.deps.query(SQL`
      UPDATE custom_commands
      SET command_id = ${newId},
        command = ${call},
        response = ${response}
      WHERE guild_id = ${guild.id}
        AND command_id = ${id}
    `);
  }

  async getCustomCommandsForGuild(guild: GuildRef): Promise<Array<Pick<CustomCommandData, 'call' | 'response'>>> {
    const query = SQL`SELECT * FROM custom_commands WHERE guild_id = ${guild.id}`;
    const [rows] = (await this.deps.query(query)) ?? [[]];
    if (rows) {
      return (rows as Array<{ command: string; response: string }>).map((row) => ({
        call: row.command,
        response: row.response,
      }));
    }
    return [];
  }

  async addCustomCommand(guild: GuildRef, call: string, response: string, creator: string) {
    const id = `${call}${guild.id}`;
    const query = SQL`INSERT INTO custom_commands (command_id, guild_id, command, response, creator_id)
      VALUES (${id}, ${guild.id}, ${call}, ${response}, ${creator})`;
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
