'use strict';

const SQL = require('sql-template-strings');
const CustomCommand = require('../../models/CustomCommand.js');

/**
 * Database Mixin for custom command queries
 * @mixin
 */
class CustomCommandQueries {
  constructor(db) {
    this.db = db;
  }

  async getCustomCommands() {
    const query = SQL`SELECT * FROM custom_commands WHERE (guild_id >> 22) % ${this.bot.shardTotal} in (${this.bot.shards})`;
    const res = await this.query(query);
    if (res[0]) {
      return res[0]
        .map(value => new CustomCommand(this.bot, value.command, value.response, value.guild_id));
    }
    return [];
  }

  async getCustomCommandRaw(guild, call) {
    const id = `${call}${guild.id}`;
    const query = SQL`SELECT * FROM custom_commands WHERE guild_id = ${guild.id} AND command_id = ${id}`;

    const [rows] = await this.query(query);
    if (rows) {
      const vals = rows
        .map(row => ({ call: row.command, response: row.response, id: row.command_id }));
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

  async getCustomCommandsForGuild(guild) {
    const query = SQL`SELECT * FROM custom_commands WHERE guild_id = ${guild.id}`;
    const [rows] = await this.query(query);
    if (rows) {
      return rows
        .map(row => new CustomCommand(this.bot, row.command, row.response, row.guild_id));
    }
    return [];
  }

  async addCustomCommand(message, call, response) {
    const id = `${call}${message.guild.id}`;
    const query = SQL`INSERT INTO custom_commands (command_id, guild_id, command, response, creator_id)
      VALUES (${id}, ${message.guild.id}, ${call}, ${response}, ${message.author.id})`;
    return this.query(query);
  }

  async deleteCustomCommand(message, call) {
    const id = `${call}${message.guild.id}`;
    const query = SQL`DELETE FROM custom_commands WHERE command_id = ${id}`;
    return this.query(query);
  }

  async removeGuildCustomCommands(guildId) {
    const query = SQL`DELETE FROM custom_commands WHERE guild_id = ${guildId}`;
    return this.query(query);
  }
}

module.exports = CustomCommandQueries;
