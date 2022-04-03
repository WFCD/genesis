import SQL from 'sql-template-strings';

/**
 * Database Mixin for custom command queries
 * @mixin
 */
export default class CustomCommandQueries {
  /**
   * Get raw custom commands for specified guild
   * @param {string} guildId guild identifier
   * @returns {Promise<Array<CustomCommandData>>}
   */
  async getRawCustomCommands(guildId) {
    const query = guildId
      ? SQL`SELECT * FROM custom_commands where guild_id = ${guildId};`
      : SQL`SELECT * FROM custom_commands;`;

    const [rows] = await this.query(query);
    return rows?.length
      ? rows.map((row) => {
          try {
            return {
              call: row.command,
              response: decodeURIComponent(row.response),
              guildId: row.guild_id,
            };
          } catch (ignored) {
            return {
              call: row.command,
              response: row.response,
              guildId: row.guild_id,
            };
          }
        })
      : undefined;
  }

  /**
   * @typedef {Object} CustomCommandData
   * @property {Discord.Snowflake} [guildId] guild identifier
   * @property {string} call command prompt
   * @property {string} response response to call
   * @property {string} [id] identifier composed of call and guild id
   */

  /**
   * Get raw custom command data
   * @param {Discord.Guild} guild guild to fetch commands for
   * @param {string} call command prompt
   * @returns {Promise<undefined|*>}
   */
  async getCustomCommandRaw(guild, call) {
    const id = `${call}${guild.id}`;
    const query = SQL`SELECT * FROM custom_commands WHERE guild_id = ${guild.id} AND command_id = ${id}`;

    const [rows] = await this.query(query);
    if (rows) {
      const vals = rows.map((row) => ({ call: row.command, response: row.response, id: row.command_id }));
      this.logger.warn(JSON.stringify(vals));
      return vals[0];
    }
    return undefined;
  }

  async updateCustomCommand(guild, { call, response, id }) {
    const newId = `${call}${guild.id}`;
    return this.query(SQL`
      UPDATE custom_commands
      SET command_id = ${newId},
        command = ${call},
        response = ${response}
      WHERE guild_id = ${guild.id}
        AND command_id = ${id}
    `);
  }

  /**
   * Get the custom commands for a guild
   * @param {Discord.Guild} guild guild to pull commands for
   * @returns {Promise<*[]|*>}
   */
  async getCustomCommandsForGuild(guild) {
    const query = SQL`SELECT * FROM custom_commands WHERE guild_id = ${guild.id}`;
    const [rows] = await this.query(query);
    if (rows) {
      return rows.map((row) => ({
        call: row.command,
        response: row.response,
      }));
    }
    return [];
  }

  /**
   * Add a custom command
   * @param {Discord.Guild} guild guild to delete from
   * @param {string} call prompt for command
   * @param {string} response response for command
   * @param {Discord.Snowflake} creator command creator
   * @returns {Promise<*>}
   */
  async addCustomCommand(guild, call, response, creator) {
    const id = `${call}${guild.id}`;
    const query = SQL`INSERT INTO custom_commands (command_id, guild_id, command, response, creator_id)
      VALUES (${id}, ${guild.id}, ${call}, ${response}, ${creator})`;
    return this.query(query);
  }

  /**
   * Delete custom commands for the guild based on the custom command call
   * @param {Discord.Guild} guild guild to delete from
   * @param {string} call call for custom command to delete
   * @returns {Promise<*>}
   */
  async deleteCustomCommand(guild, call) {
    const id = `${call}${guild.id}`;
    const query = SQL`DELETE FROM custom_commands WHERE command_id = ${id}`;
    return this.query(query);
  }

  /**
   * Remove all custm commands for a guild based on the id
   * @param {Discord.Snowflake} guildId guild id
   * @returns {Promise<*>}
   */
  async removeGuildCustomCommands(guildId) {
    const query = SQL`DELETE FROM custom_commands WHERE guild_id = ${guildId}`;
    return this.query(query);
  }
}
