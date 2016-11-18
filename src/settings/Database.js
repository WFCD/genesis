'use strict';

const mysql = require('mysql2/promise');
const SQL = require('sql-template-strings');
const Promise = require('bluebird');
const schema = require('./schema.js');

/**
 * Connection options for the database
 * @typedef {Object} DbConnectionOptions
 * @property {string} [host=localhost] - The hostname of the database
 * @property {number} [port=3306] - The port number to connect to
 * @property {string} user - The user to authenticate as
 * @property {string} password - The password for that user
 * @property {string} database - The database to use
 */

/**
 * Persistent storage for the bot
 */
class Database {
  /**
   * @param {DbConnectionOptions} dbOptions Connection options for the database
   * @param {Genesis} bot Bot to load the settings for
   */
  constructor(dbOptions, bot) {
    this.db = mysql.createPool({
      supportBigNumbers: true,
      bigNumberStrings: true,
      Promise,
      ...dbOptions,
    });
    this.bot = bot;
  }

  /**
   * Creates the required tables in the database
   * @returns {Promise}
   */
  createSchema() {
    return Promise.mapSeries(schema, q => this.db.query(q));
  }

  /**
   * Adds a new guild to the database
   * @param {Guild} guild A Discord guild (server)
   * @returns {Promise}
   */
  addGuild(guild) {
    const channelIDs = guild.channels.keyArray();
    const query = SQL`INSERT IGNORE INTO channels (id, guild_id) VALUES `;
    const rows = channelIDs.reduce((sql, id, index) =>
      sql.append(SQL`(${id}, ${guild.id})`).append(index !== (channelIDs.length - 1) ? ',' : ';')
    );

    query.append(rows);

    return this.db.execute(query);
  }

  /**
   * Adds a new guild text channel to the database
   * @param {TextChannel} channel A discord guild text channel
   * @returns {Promise}
   */
  addGuildTextChannel(channel) {
    const query = SQL`INSERT IGNORE INTO channels (id, guildID) VALUES (${channel.id}, ${channel.guild.id}) `;
    return this.db.execute(query);
  }

  /**
   * Adds a new DM or group DM channel to the database
   * @param {DMChannel|GroupDMChannel} channel A discord DM or group DM channel
   * @returns {Promise}
   */
  addDMChannel(channel) {
    const query = SQL`INSERT IGNORE INTO channels (id) VALUES (${channel.id});`;
    return this.db.execute(query);
  }

  /**
   * Deletes a channel from the database
   * @param {Channel} channel The channel to delete
   * @returns {Promise}
   */
  deleteChannel(channel) {
    const query = SQL`DELETE FROM channels WHERE id = ${channel.id};`;
    return this.db.execute(query);
  }

  /**
   * Sets the language for a channel
   * @param {Channel} channel The Discord channel for which to set the language
   * @param {string} language The new language for this channel
   * @returns {Promise}
   */
  setChannelLanguage(channel, language) {
    const query = SQL`UPDATE channels SET language = ${language} WHERE id = ${channel.id};`;
    return this.db.execute(query);
  }

  /**
   * Sets the platform for a channel
   * @param {Channel} channel The Discord channel for which to set the platform
   * @param {string} platform The new platform for this channel
   * @returns {Promise}
   */
  setChannelPlatform(channel, platform) {
    const query = SQL`UPDATE channels SET platform = ${platform} WHERE id = ${channel.id};`;
    return this.db.execute(query);
  }

  /**
   * Returns the language for a channel
   * @param {Channel} channel The channel
   * @returns {Promise.<string>}
   */
  getChannelLanguage(channel) {
    const query = SQL`SELECT language FROM channels WHERE id = ${channel.id};`;
    return this.db.execute(query)
      .then((res) => {
        if (res.rows.length === 0) {
          throw new Error(`The channel with ID ${channel.id} was not found in the database`);
        }
        return res.rows[0].language;
      });
  }

  /**
   * Returns the language for a channel
   * @param {Channel} channel The channel
   * @returns {Promise.<string>}
   */
  getChannelPlatform(channel) {
    const query = SQL`SELECT platform FROM channels WHERE id = ${channel.id};`;
    return this.db.execute(query)
      .then((res) => {
        if (res.rows.length === 0) {
          throw new Error(`The channel with ID ${channel.id} was not found in the database`);
        }
        return res.rows[0].platform;
      });
  }

  /**
   * Enables notifications for an item in a channel
   * @param {Channel} channel The channel where to enable notifications
   * @param {string} item The item to track
   * @returns {Promise}
   */
  trackItem(channel, item) {
    const query = SQL`INSERT IGNORE INTO item_notifications (channel_id, item) VALUES (${channel.id}, ${item});`;
    return this.db.execute(query);
  }

  /**
   * Disables notifications for an item in a channel
   * @param {Channel} channel The channel where to enable notifications
   * @param {string} item The item to track
   * @returns {Promise}
   */
  untrackItem(channel, item) {
    const query = SQL`DELETE FROM item_notifications WHERE channel_id = ${channel.id} AND item = ${item};`;
    return this.db.execute(query);
  }

  /**
   * Enables notifications for an event type in a channel
   * @param {Channel} channel The channel where to enable notifications
   * @param {string} type The item to track
   * @returns {Promise}
   */
  trackEventType(channel, type) {
    const query = SQL`INSERT IGNORE INTO type_notifications (channel_id, type) VALUES (${channel.id}, ${type});`;
    return this.db.execute(query);
  }

  /**
   * Disables notifications for an event type in a channel
   * @param {Channel} channel The channel where to enable notifications
   * @param {string} type The item to track
   * @returns {Promise}
   */
  untrackEventType(channel, type) {
    const query = SQL`DELETE FROM type_notifications WHERE channel_id = ${channel.id} AND type = ${type};`;
    return this.db.execute(query);
  }

  /**
   * Enables or disables pings for an item in a channel
   * @param {TextChannel} channel The channel where to enable notifications
   * @param {string} item The item to set ping status for
   * @param {boolean} enabled true to enable pinging, false to disable
   * @returns {Promise}
   */
  setItemPing(channel, item, enabled) {
    const query = SQL`UPDATE item_notifications SET ping = ${enabled} WHERE channel_id = ${channel.id}
      AND item = ${item};`;
    return this.db.execute(query);
  }

  /**
   * Enables or disables pings for an event type in a channel
   * @param {TextChannel} channel The channel where to enable notifications
   * @param {string} type The event type to set ping status for
   * @param {boolean} enabled true to enable pinging, false to disable
   * @returns {Promise}
   */
  setEventTypePing(channel, type, enabled) {
    const query = SQL`UPDATE type_notifications SET ping = ${enabled} WHERE channel_id = ${channel.id}
      AND type = ${type};`;
    return this.db.execute(query);
  }

  /**
   * Sets a ping message for an item or event type in a guild
   * @param {Guild} guild The guild
   * @param {string} itemOrType The item or event type to set the ping message for
   * @param {string} text The text of the ping message
   * @returns {Promise}
   */
  setPing(guild, itemOrType, text) {
    const query = SQL`INSERT INTO pings VALUES (${guild.id}, ${itemOrType}, ${text})
      ON DUPLICATE KEY UPDATE text = ${text};`;
    return this.db.execute(query);
  }

  /**
   * Removes a ping message
   * @param {Guild} guild The guild where the ping message is currently being sent
   * @param {string} itemOrType The item or event type associated to the ping message
   * @returns {Promise}
   */
  removePing(guild, itemOrType) {
    const query = SQL`DELETE FROM pings WHERE guild_id = ${guild.id} AND item_or_type = ${itemOrType};`;
    return this.db.execute(query);
  }

  /**
   * Returns all the channels that should get a notification for the items in the list
   * @param {string} type The type of the event
   * @param {string} platform The platform of the event
   * @param {Array.<string>} items The items in the reward that is being notified
   * @returns {Promise.<Array.<{channel_id: string, webhook: string, ping: string}>>}
   */
  getNotifications(type, platform, items) {
    const query = SQL`SELECT channel.id AS channel_id, channel.webhook AS webhook,
      GROUP_CONCAT(pings.text SEPARATOR '\n') AS ping
      FROM type_notifications ```
      .append(items ? 'LEFT JOIN item_notifications USING (channel_id) ' : '')
      .append('INNER JOIN channels ON type_notifications.channel_id = channels.id')
      .append('LEFT JOIN pings ON channels.guild_id = pings.guild_id AND ( ')
      .append(items ? '(item_notifications.item = pings.item_or_type AND item_notifications.ping = TRUE) OR ' : '')
      .append(SQL```(type_notifications.type = pings.item_or_type AND type_notifications.ping = TRUE) 
      )
      WHERE
        type_notifications.type = ${type} AND
        (IFNULL(channels.guild_id, 0) >> 22) % ${this.bot.shardCount} = ${this.bot.shardId} AND
        channels.platform = ${platform} ```)
      .append(items ? SQL```AND notifications.item IN (${items}) ``` : '')
      .append('GROUP BY notifications.channel_id;');
    return this.db.query(query);
  }

  /**
   * Returns the items that the channel is tracking
   * @param {Channel} channel A Discord channel
   * @returns {Promise.<Array.<string>>}
   */
  getTrackedItems(channel) {
    const query = SQL`SELECT item FROM item_notifications WHERE channel_id = ${channel.id};`;
    return this.db.execute(query)
      .then(res => res.map(r => r.item));
  }

  /**
   * Returns the event types that the channel is tracking
   * @param {Channel} channel A Discord channel
   * @returns {Promise.<Array.<string>>}
   */
  getTrackedEventTypes(channel) {
    const query = SQL`SELECT type FROM type_notifications WHERE channel_id = ${channel.id};`;
    return this.db.execute(query)
      .then(res => res.map(r => r.type));
  }

  /**
   * Enables or disables a command for an individual member in a channel
   * @param {GuildChannel} channel - A discord guild channel
   * @param {GuildMember} member - A discord guild member
   * @param {string} commandId - The ID of the command to set the permission for
   * @param {boolean} allowed - Whether this member should be allowed to use this command
   * @returns {Promise}
   */
  setChannelPermissionForMember(channel, member, commandId, allowed) {
    const query = SQL`INSERT INTO channel_permissions VALUES
      (${channel.id}, ${member.id}, TRUE, ${commandId}, ${allowed})
      ON DUPLICATE KEY UPDATE allowed = ${allowed};`;
    return this.db.execute(query);
  }

  /**
   * Enables or disables a command for a role in a channel
   * @param {GuildChannel} channel - A discord guild channel
   * @param {Role} role - A discord role
   * @param {string} commandId - The ID of the command to set the permission for
   * @param {boolean} allowed - Whether this member should be allowed to use this command
   * @returns {Promise}
   */
  setChannelPermissionForRole(channel, role, commandId, allowed) {
    const query = SQL`INSERT INTO channel_permissions VALUES
      (${channel.id}, ${role.id}, FALSE, ${commandId}, ${allowed})
      ON DUPLICATE KEY UPDATE allowed = ${allowed};`;
    return this.db.execute(query);
  }

  /**
   * Enables or disables a command for an individual member in a guild
   * @param {Guild} guild - A discord guild
   * @param {GuildMember} member - A discord guild member
   * @param {string} commandId - The ID of the command to set the permission for
   * @param {boolean} allowed - Whether this member should be allowed to use this command
   * @returns {Promise}
   */
  setGuildPermissionForMember(guild, member, commandId, allowed) {
    const query = SQL`INSERT INTO guild_permissions VALUES
      (${guild.id}, ${member.id}, TRUE, ${commandId}, ${allowed})
      ON DUPLICATE KEY UPDATE allowed = ${allowed};`;
    return this.db.execute(query);
  }

  /**
   * Enables or disables a command for a role in a channel
   * @param {Guild} guild - A discord guild
   * @param {Role} role - A discord role
   * @param {string} commandId - The ID of the command to set the permission for
   * @param {boolean} allowed - Whether this member should be allowed to use this command
   * @returns {Promise}
   */
  setGuildPermissionForRole(guild, role, commandId, allowed) {
    const query = SQL`INSERT INTO guild_permissions VALUES
      (${guild.id}, ${role.id}, FALSE, ${commandId}, ${allowed})
      ON DUPLICATE KEY UPDATE allowed = ${allowed};`;
    return this.db.execute(query);
  }

  /**
   * Stops tracking all event types in a channel (disables all notifications)
   * @param {Channel} channel A Discord channel
   * @returns {Promise}
   */
  stopTracking(channel) {
    const query = SQL`DELETE FROM type_notifications WHERE channel_id = ${channel.id};`;
    return this.db.execute(query);
  }
}

module.exports = Database;
