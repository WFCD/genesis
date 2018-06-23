'use strict';

const SQL = require('sql-template-strings');
const CustomCommand = require('../../models/CustomCommand.js');

class CustomCommandQueries {
  constructor(db) {
    this.db = db;
  }

  async getCustomCommands() {
    this.logger.debug(`Shards: ${this.bot.shardCount}, this shard's id: ${this.bot.shardId}`);
    const query = SQL`SELECT * FROM custom_commands WHERE (guild_id >> 22) % ${this.bot.shardCount} = ${this.bot.shardId}`;
    const res = await this.db.query(query);
    if (res[0]) {
      return res[0]
        .map(value => new CustomCommand(this.bot, value.command, value.response, value.guild_id));
    }
    return [];
  }

  async getCustomCommandsForGuild(guild) {
    const query = SQL`SELECT * FROM custom_commands WHERE guild_id = ${guild.id}`;
    const res = await this.db.query(query);
    if (res[0]) {
      return res[0]
        .map(value => new CustomCommand(this.bot, value.command, value.response, value.guild_id));
    }
    return [];
  }

  async addCustomCommand(message, call, response) {
    const id = `${call}${message.guild.id}`;
    const query = SQL`INSERT INTO custom_commands (command_id, guild_id, command, response, creator_id)
      VALUES (${id}, ${message.guild.id}, ${call}, ${response}, ${message.author.id})`;
    return this.db.query(query);
  }

  async deleteCustomCommand(message, call) {
    const id = `${call}${message.guild.id}`;
    const query = SQL`DELETE FROM custom_commands WHERE command_id = ${id}`;
    return this.db.query(query);
  }

  async removeGuildCustomCommands(guildId) {
    const query = SQL`DELETE FROM custom_commands WHERE guild_id = ${guildId}`;
    return this.db.query(query);
  }
}

module.exports = CustomCommandQueries;
