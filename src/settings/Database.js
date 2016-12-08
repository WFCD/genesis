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
   * Sets whether or not to respond in a channel to settings changes
   * @param {Channel} channel The Discord channel for which to set the response setting
   * @param {boolean} respond Whether or not to respond to settings changes
   * @returns {Promise}
   */
  setChannelResponseToSettings(channel, respond) {
    const query = SQL`UPDATE channels SET respond_to_settings = ${respond} WHERE id = ${channel.id};`;
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
   * Returns the platform for a channel
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
   * Returns the respond_to_settings setting for a channel
   * @param {Channel} channel The channel
   * @returns {Promise.<boolean>}
   */
  getChannelRespondToSettings(channel) {
    const query = SQL`SELECT platform FROM channels WHERE id = ${channel.id};`;
    return this.db.execute(query)
      .then((res) => {
        if (res.rows.length === 0) {
          throw new Error(`The channel with ID ${channel.id} was not found in the database`);
        }
        return res.rows[0].respond_to_settings;
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
   * @param {Channel} channel - A Discord channel
   * @returns {Promise}
   */
  stopTracking(channel) {
    const query = SQL`DELETE FROM type_notifications WHERE channel_id = ${channel.id};`;
    return this.db.execute(query);
  }

  /**
   * Gets whether or not a user is allowed to use a particular command in a channel
   * @param {Channel} channel - A Discord channel
   * @param {string} memberId - String representing a user identifier
   * @param {string} commandId - String representing a command identifier
   * @returns {Promise}
   */
  getChannelPermissionForMember(channel, memberId, commandId) {
    const query = SQL`SELECT allowed FROM channel_permissions
    WHERE channel_id = ${channel.id} AND command_id = ${commandId}
    AND is_user = true AND target_id = ${memberId}`;
    return this.db.execute(query)
      .then((res) => {
        if (res.rows.length === 0) {
          throw new Error(`The channel permissions for the channel ${channel.id}
             for member ${memberId} was not found in the database`);
        }
        return res.rows[0].allowed;
      });
  }

  /**
   * Gets whether or not a role is allowed to use a particular command in a channel
   * @param {Channel} channel A Discord channel
   * @param {string} role String representing a user identifier
   * @param {string} commandId String representing a command identifier
   * @returns {Promise}
   */
  getChannelPermissionForRole(channel, role, commandId) {
    const query = SQL`SELECT allowed FROM channel_permissions
    WHERE channel_id = ${channel.id} AND command_id = ${commandId}
    AND is_user = false AND target_id = ${role.id}`;
    return this.db.execute(query)
      .then((res) => {
        if (res.rows.length === 0) {
          throw new Error(`The channel permissions for the channel ${channel.id}
             for role ${role.id} was not found in the database`);
        }
        return res.rows[0].allowed;
      });
  }

  /**
   * Gets whether or not a role in the user's
   * roles allows the user to use a particular command in a channel
   * @param {Channel} channel - A Discord channel
   * @param {User} user - A Discord user
   * @param {string} commandId - A command id for designating
   *                           a command to check permisions for
   * @returns {Promise}
   */
  getChannelPermissionForUserRoles(channel, user, commandId) {
    const userRoles = channel.guild.member(user).roles;
    const userRoleIds = userRoles.keyArray();
    const query = SQL`SELECT target_id, is_user, allowed
        FROM channel_permissions
        WHERE channel_permissions.channel_id = ${channel.id}
          AND channel_permissions.target_id IN (${userRoleIds})
          AND command_id = ${commandId}
        UNION SELECT guild_permissions.target_id AS target_id,
             guild_permissions.is_user AS is_user,
             guild_permissions.allowed AS allowed
        FROM guild_permissions
        INNER JOIN channels USING (guild_id)
        LEFT JOIN channel_permissions ON
          channel_permissions.channel_id = channels.id
          AND guild_permissions.command_id = channel_permissions.command_id
          AND guild_permissions.target_id = channel_permissions.target_id
        WHERE channel_permissions.target_id IS NULL
          AND channels.id = ${channel.id}
          AND guild_permissions.target_id IN (${userRoleIds});`;
    return this.db.execute(query)
    .then((res) => {
      if (res.rows.length === 0) {
        throw new Error(`The channel permissions for the channel ${channel.id}
           for roles: ${userRoles.array().map(role => role.name).join(', ')} were not found in the database`);
      }

      return res.rows[0].allowed;
    });
  }

  /**
   * Gets whether or not a user is allowed to use a particular command in a guild
   * @param {Guild} guild - A Discord guild
   * @param {string} memberId - String representing a user identifier
   * @param {string} commandId - String representing a command identifier
   * @returns {Promise}
   */
  getGuildPermissionForMember(guild, memberId, commandId) {
    const query = SQL`SELECT allowed FROM guild_permissions
    WHERE channel_id = ${guild.id} AND command_id = ${commandId}
    AND is_user = true AND target_id = ${memberId}`;
    return this.db.execute(query)
      .then((res) => {
        if (res.rows.length === 0) {
          throw new Error(`The guild permissions for the guild ${guild.id}
             for member ${memberId} was not found in the database`);
        }
        return res.rows[0].allowed;
      });
  }

  /**
   * Gets whether or not a role is allowed to use a particular command in a guild
   * @param {Guild} guild - A Discord guild
   * @param {string} role String representing a user identifier
   * @param {string} commandId String representing a command identifier
   * @returns {Promise}
   */
  getGuildPermissionForRole(guild, role, commandId) {
    const query = SQL`SELECT allowed FROM guild_permissions
    WHERE channel_id = ${guild.id} AND command_id = ${commandId}
    AND is_user = false AND target_id = ${role.id}`;
    return this.db.execute(query)
      .then((res) => {
        if (res.rows.length === 0) {
          throw new Error(`The guild permissions for the guild ${guild.id}
             for member ${role.id} was not found in the database`);
        }
        return res.rows[0].allowed;
      });
  }

  removeGuild(guild) {
    const channelIds = guild.channels.keyArray();
    const permissionResults = [];
    const notificationsResults = [];
    channelIds.forEach((channelId) => {
      permissionResults.push(this.removeChannelPermissions(channelId));
      notificationsResults.push(this.removeItemNotifications(channelId));
    });
    permissionResults.push(this.removeGuildPermissions(guild.id));
    notificationsResults.push(this.removePings(guild.id));
    permissionResults.forEach(result => result.then(removalSucceeded => this.logger.debug(`Result of removal: ${removalSucceeded ? 'success' : 'failure'}`)));
    notificationsResults.forEach(result => result.then(removalSucceeded => this.logger.debug(`Result of removal: ${removalSucceeded ? 'success' : 'failure'}`)));
    const query = SQL`DELETE FROM channels WHERE guild_id = ${guild.id})`;
    return this.db.execute(query)
    .then(res => res);
  }

  removeGuildPermissions(guildId) {
    const query = SQL`DELETE FROM guild_permissions WHERE guild_id = ${guildId}`;
    return this.db.execute(query)
      .then(res => res);
  }

  removeChannelPermissions(channelId) {
    const query = SQL`DELETE FROM channel_permisions WHERE channel_id = ${channelId}`;
    return this.db.execute(query)
    .then(res => res);
  }

  removeItemNotifications(channelId) {
    const query = SQL`DELETE FROM item_notifications WHERE channel_id = ${channelId}`;
    return this.db.execute(query)
    .then(res => res);
  }

  removePings(guildId) {
    const query = SQL`DELETE FROM pings WHERE guild_id = ${guildId}`;
    return this.db.execute(query)
    .then(res => res);
  }
}

module.exports = Database;
