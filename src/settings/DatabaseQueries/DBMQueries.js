'use strict';

const Promise = require('bluebird');
const SQL = require('sql-template-strings');
// eslint-disable-next-line no-unused-vars
const { Snowflake } = require('discord-api-types/v9');
// eslint-disable-next-line no-unused-vars
const Discord = require('discord.js');
const schema = require('../schema.js');
const integrations = require('../integrations');

/**
 * Database Mixin for DBM queries
 * @mixin
 * @mixes Database
 * @mixes PermissionsQueries
 * @mixes CustomCommandQueries
 * @mixes PingsQueries
 * @mixes SettingsQueries
 * @mixes PrivateRoomQueries
 */
class DBMQueries {
  /**
   * Creates the required tables in the database
   * @returns {Promise}
   */
  createSchema() {
    try {
      const things = [Promise.mapSeries(schema, q => this.query(q))];
      things.push(Promise.mapSeries(integrations, integration => integration(this)));
      return Promise.all(things);
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

    const channelIDs = guild.channels.cache.filter(c => c.type === 'text').keys();
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
   * @param {Discord.TextChannel} channel A discord guild text channel
   * @returns {Promise}
   */
  async addGuildTextChannel(channel) {
    const query = SQL`INSERT IGNORE INTO channels (id, guild_id) VALUES (${channel.id}, ${channel.guild.id});`;
    return this.query(query);
  }

  /**
   * Adds a new DM or group DM channel to the database
   * @param {Discord.DMChannel} channel A discord DM or group DM channel
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
   * @param  {Discord.Guild} guild Guild to be removed from database
   * @returns {Promise.<string>} status of removal
   */
  async removeGuild(guild) {
    if (!guild?.available) return false;
    const query = SQL`DELETE FROM channels WHERE guild_id = ${guild.id}`;
    await this.query(query);
    const results = [];
    guild.channels.cache.forEach((channel, channelId) => {
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
