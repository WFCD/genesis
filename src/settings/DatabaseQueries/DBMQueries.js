'use strict';

const Promise = require('bluebird');
const SQL = require('sql-template-strings');
const schema = require('../schema.js');

class DBMQueries {
  constructor(db) {
    this.db = db;
  }

  /**
   * Creates the required tables in the database
   * @returns {Promise}
   */
  createSchema() {
    try {
      return Promise.mapSeries(schema, q => this.query(q));
    } catch (e) {
      this.logger.fatal(e);
      return undefined;
    }
  }

  /**
  * Initialize data for guilds in channels for existing guilds
  * @param {Client} client for pulling guild information
  */
  async ensureData(client) {
    const promises = [];
    client.guilds.cache.each((guild) => {
      if (guild.channels.cache.size) {
        promises.push(this.addGuild(guild));
      }
    });
    await Promise.all(promises);
  }

  /**
   * Adds a new guild to the database
   * @param {Guild} guild A Discord guild (server)
   * @returns {Promise}
   */
  addGuild(guild) {
    if (!guild.available) return undefined;

    const channelIDs = guild.channels.cache.filter(c => c.type === 'text').keyArray();
    if (channelIDs.length) {
      const query = SQL`INSERT IGNORE INTO channels (id, guild_id) VALUES `;
      channelIDs.forEach((id, index) => {
        query.append(SQL`(${id}, ${guild.id})`).append(index !== (channelIDs.length - 1) ? ',' : ';');
      });

      return this.query(query);
    }
    return undefined;
  }

  /**
   * Adds a new guild text channel to the database
   * @param {TextChannel} channel A discord guild text channel
   * @returns {Promise}
   */
  async addGuildTextChannel(channel) {
    const query = SQL`INSERT IGNORE INTO channels (id, guild_id) VALUES (${channel.id}, ${channel.guild.id});`;
    return this.query(query);
  }

  /**
   * Adds a new DM or group DM channel to the database
   * @param {DMChannel|GroupDMChannel} channel A discord DM or group DM channel
   * @returns {Promise}
   */
  async addDMChannel(channel) {
    const query = SQL`INSERT IGNORE INTO channels (id) VALUES (${channel.id});`;
    return this.query(query);
  }

  /**
   * Deletes a channel from the database
   * @param {Channel} channel The channel to delete
   * @returns {Promise}
   */
  async deleteChannel(channel) {
    const query = SQL`DELETE FROM channels WHERE id = ${channel.id};`;
    return this.query(query);
  }

  /**
   * Remove guild from database
   * @param  {snowflake} guild Guild to be removed from database
   * @returns {Promise.<string>} status of removal
   */
  async removeGuild(guild) {
    const query = SQL`DELETE FROM channels WHERE guild_id = ${guild.id}`;
    await this.query(query);
    const channelIds = guild.channels.keyArray();
    const results = [];
    channelIds.forEach((channelId) => {
      results.push(this.removeChannelPermissions(channelId));
      results.push(this.removeItemNotifications(channelId));
      results.push(this.removeSettings(channelId));
    });
    results.push(this.removePrivateChannels(guild.id));
    results.push(this.removeGuildPermissions(guild.id));
    results.push(this.removePings(guild.id));
    results.push(this.removeGuildCustomCommands(guild.id));
    results.push(this.deleteGuildRatio(guild));
    return Promise.all(results);
  }
}

module.exports = DBMQueries;
