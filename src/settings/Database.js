'use strict';

const SQL = require('sql-template-strings');
const mysql = require('mysql2/promise');
const Promise = require('bluebird');
const schema = require('./schema.js');
const CustomCommand = require('../CustomCommand.js');

/**
 * Connection options for the database
 * @typedef {Object} DbConnectionOptions
 * @property {string} [host=localhost] - The hostname of the database
 * @property {number} [port=3306] - The port number to connect to
 * @property {string} user - The user to authenticate as
 * @property {string} password - The password for that user
 * @property {string} database - The database to use
 */

const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const makeId = () => {
  const tokens = [];
  for (let i = 0; i < 8; i += 1) {
    tokens.push(possible.charAt(Math.floor(Math.random() * possible.length)));
  }
  return tokens.join('');
};

/**
 * Persistent storage for the bot
 */
class Database {
  /**
   * @param {DbConnectionOptions} dbOptions Connection options for the database
   * @param {Genesis} bot Bot to load the settings for
   */
  constructor(dbOptions, bot) {
    this.bot = bot;
    this.logger = bot.logger;

    const opts = {
      supportBigNumbers: true,
      bigNumberStrings: true,
      Promise,
    };
    Object.assign(opts, dbOptions);
    this.db = mysql.createPool(opts);

    this.defaults = {
      prefix: '/',
      respond_to_settings: true,
      platform: 'pc',
      language: 'en',
      delete_after_respond: true,
      delete_response: true,
      createPrivateChannel: false,
      deleteExpired: false,
      allowCustom: false,
      allowInline: false,
    };
  }

  /**
   * Creates the required tables in the database
   * @returns {Promise}
   */
  createSchema() {
    return Promise.mapSeries(schema, q => this.db.query(q));
  }

  /**
  * Initialize data for guilds in channels for existing guilds
  * @param {Client} client for pulling guild information
  */
  async ensureData(client) {
    const promises = [];
    client.guilds.array().forEach((guild) => {
      if (guild.channels.array().length) {
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
    const channelIDs = guild.channels.filter(c => c.type === 'text').keyArray();
    const query = SQL`INSERT IGNORE INTO channels (id, guild_id) VALUES `;
    channelIDs.forEach((id, index) => {
      query.append(SQL`(${id}, ${guild.id})`).append(index !== (channelIDs.length - 1) ? ',' : ';');
    });

    return this.db.query(query);
  }

  /**
   * Gets the current count of guilds and channels
   * @returns {Promise}
   */
  async getChannelAndGuildCounts() {
    const query = 'select count(distinct guild_id) as countGuilds, count(distinct id) as countChannels from channels;';
    const res = this.db.query(query);
    if (res[0]) {
      return {
        channels: res[0].countChannels,
        guilds: res[0].countGuilds,
      };
    }
    return {};
  }

  /**
   * Adds a new guild text channel to the database
   * @param {TextChannel} channel A discord guild text channel
   * @returns {Promise}
   */
  async addGuildTextChannel(channel) {
    const query = SQL`INSERT IGNORE INTO channels (id, guild_id) VALUES (${channel.id}, ${channel.guild.id});`;
    return this.db.query(query);
  }

  /**
   * Adds a new DM or group DM channel to the database
   * @param {DMChannel|GroupDMChannel} channel A discord DM or group DM channel
   * @returns {Promise}
   */
  async addDMChannel(channel) {
    const query = SQL`INSERT IGNORE INTO channels (id) VALUES (${channel.id});`;
    return this.db.query(query);
  }

  /**
   * Deletes a channel from the database
   * @param {Channel} channel The channel to delete
   * @returns {Promise}
   */
  async deleteChannel(channel) {
    const query = SQL`DELETE FROM channels WHERE id = ${channel.id};`;
    return this.db.query(query);
  }

  async getGuildSetting(guild, setting) {
    if (guild) {
      const query = SQL`SELECT val FROM settings, channels WHERE channel_id=channels.id and channels.guild_id=${guild.id} and settings.setting =${setting}`;
      const res = await this.db.query(query);
      if (res[0].length === 0) {
        await this.setGuildSetting(guild, setting, this.defaults[`${setting}`]);
        return this.defaults[`${setting}`];
      }
      await this.setGuildSetting(guild, setting, res[0][0].val);
      return res[0][0].val;
    }
    return this.defaults[`${setting}`];
  }

  async checkWebhookAndReturn(channel, setting) {
    if (!/webhook/.test(setting)) {
      await this.setChannelSetting(channel, setting, this.defaults[`${setting}`]);
      return this.defaults[`${setting}`];
    }
    return undefined;
  }

  /**
   * Get a setting for a particular channel
   * @param {Channel} channel channel to get the setting for
   * @param {string} setting name of the setting to get
   * @returns {Promise} setting
   */
  async getChannelSetting(channel, setting) {
    const query = SQL`SELECT val FROM settings WHERE settings.channel_id=${channel.id} and settings.setting=${setting};`;
    const res = await this.db.query(query);
    if (res[0].length === 0) {
      if (channel.type === 'text') {
        await this.addGuildTextChannel(channel);
      } else {
        await this.addDMChannel(channel);
      }
      return this.checkWebhookAndReturn(channel, setting);
    }
    return res[0][0].val;
  }

  async getChannelWebhook(channel) {
    return {
      avatar: await this.getChannelSetting(channel, 'webhookAvatar') || this.bot.client.user.avatarURL.replace('?size=2048', ''),
      name: await this.getChannelSetting(channel, 'webhookName') || this.bot.client.user.username,
      id: await this.getChannelSetting(channel, 'webhookId'),
      token: await this.getChannelSetting(channel, 'webhookToken'),
    };
  }

  /**
   * Get a setting for a particular channel
   * @param {Channel} channel channel to get the setting for
   * @param {string} setting name of the setting to set
   * @param {string|boolean} value value of the setting to be set
   * @returns {Promise} setting
   */
  async setChannelSetting(channel, setting, value) {
    const query = SQL`INSERT IGNORE INTO settings (channel_id, setting, val) VALUE (${channel.id},${setting},${value}) ON DUPLICATE KEY UPDATE val=${value};`;
    return this.db.query(query);
  }

  /**
   * Resets the custom prefix for this guild to the bot's globally configured prefix
   * @param {Guild} guild The Discord guild for which to set the response setting
   * @param {string} setting Name of the setting to set
   * @param {string|boolean} val value of the setting to be set
   * @returns {Promise}
   */
  async setGuildSetting(guild, setting, val) {
    const promises = [];
    guild.channels.array().forEach((channel) => {
      promises.push(this.setChannelSetting(channel, setting, val));
    });
    return Promise.all(promises);
  }

  /**
   * Enables notifications for an item in a channel
   * @param {Channel} channel The channel where to enable notifications
   * @param {string} item The item to track
   * @returns {Promise}
   */
  async trackItem(channel, item) {
    const query = SQL`INSERT IGNORE INTO item_notifications (channel_id, item) VALUES (${channel.id},${item});`;
    return this.db.query(query);
  }

  /**
   * Enables notifications for items in a channel
   * @param {Channel} channel The channel where to enable notifications
   * @param {string} items The items to track
   * @returns {Promise}
   */
  async trackItems(channel, items) {
    const query = SQL`INSERT IGNORE INTO item_notifications (channel_id, item) VALUES `;
    items.forEach((item, index) => {
      query.append(SQL`(${channel.id}, ${item})`).append(index !== (items.length - 1) ? ',' : ';');
    });
    return this.db.query(query);
  }

  /**
   * Disables notifications for an item in a channel
   * @param {Channel} channel The channel where to enable notifications
   * @param {string} item The item to track
   * @returns {Promise}
   */
  async untrackItem(channel, item) {
    const query = SQL`DELETE FROM item_notifications WHERE channel_id = ${channel.id} AND item = ${item};`;
    return this.db.query(query);
  }

  /**
   * Disables notifications for items in a channel
   * @param {Channel} channel The channel where to enable notifications
   * @param {string} items The items to untrack
   * @returns {Promise}
   */
  async untrackItems(channel, items) {
    const query = SQL`DELETE FROM item_notifications WHERE channel_id = ${channel.id} AND (`;
    items.forEach((item, index) => {
      query.append(index > 0 ? '  OR ' : '').append(SQL`item = ${item}`);
    });
    query.append(SQL`);`);
    return this.db.query(query);
  }

  /**
   * Enables notifications for an event type in a channel
   * @param {Channel} channel The channel where to enable notifications
   * @param {string} type The item to track
   * @returns {Promise}
   */
  async trackEventType(channel, type) {
    const query = SQL`INSERT IGNORE INTO type_notifications (channel_id, type) VALUES (${channel.id},${type});`;
    return this.db.query(query);
  }

  /**
   * Enables notifications for items in a channel
   * @param {Channel} channel The channel where to enable notifications
   * @param {string} types The types to track
   * @returns {Promise}
   */
  async trackEventTypes(channel, types) {
    const query = SQL`INSERT IGNORE INTO type_notifications (channel_id, type) VALUES `;
    types.forEach((type, index) => {
      query.append(SQL`(${channel.id}, ${type})`).append(index !== (types.length - 1) ? ',' : ';');
    });
    return this.db.query(query);
  }

  /**
   * Disables notifications for an event type in a channel
   * @param {Channel} channel The channel where to enable notifications
   * @param {string} type The item to track
   * @returns {Promise}
   */
  async untrackEventType(channel, type) {
    const query = SQL`DELETE FROM type_notifications WHERE channel_id = ${channel.id} AND type = ${type};`;
    return this.db.query(query);
  }

  /**
   * Disables notifications for event types in a channel
   * @param {Channel} channel The channel where to enable notifications
   * @param {string} types The types to untrack
   * @returns {Promise}
   */
  async untrackEventTypes(channel, types) {
    const query = SQL`DELETE FROM type_notifications WHERE channel_id = ${channel.id} AND (`;
    types.forEach((type, index) => {
      query.append(index > 0 ? '  OR ' : '').append(SQL`type = ${type}`);
    });
    query.append(SQL`);`);
    return this.db.query(query);
  }

  /**
   * Enables or disables pings for an item in a channel
   * @param {TextChannel} channel The channel where to enable notifications
   * @param {string} item The item to set ping status for
   * @param {boolean} enabled true to enable pinging, false to disable
   * @returns {Promise}
   */
  async setItemPing(channel, item, enabled) {
    const query = SQL`UPDATE item_notifications SET ping = ${enabled} WHERE channel_id = ${channel.id}
      AND item = ${item};`;
    return this.db.query(query);
  }

  /**
   * Enables or disables pings for an event type in a channel
   * @param {TextChannel} channel The channel where to enable notifications
   * @param {string} type The event type to set ping status for
   * @param {boolean} enabled true to enable pinging, false to disable
   * @returns {Promise}
   */
  async setEventTypePing(channel, type, enabled) {
    const query = SQL`UPDATE type_notifications SET ping = ${enabled} WHERE channel_id = ${channel.id}
      AND type = ${type};`;
    return this.db.query(query);
  }

  /**
   * Sets a ping message for an item or event type in a guild
   * @param {Guild} guild The guild
   * @param {string} itemOrType The item or event type to set the ping message for
   * @param {string} text The text of the ping message
   * @returns {Promise}
   */
  async setPing(guild, itemOrType, text) {
    const query = SQL`INSERT INTO pings VALUES (${guild.id}, ${itemOrType}, ${text})
      ON DUPLICATE KEY UPDATE text = ${text};`;
    return this.db.query(query);
  }

  /**
   * Get all pings for a guild for the provided event types and items
   * @param  {Guild} guild                 Guild to get pings for
   * @param  {Array.<string>} itemsOrTypes array of strings corresponding to event and reward types
   * @returns {Promise.<string>}            Promise of a string to prepend to a message
   */
  async getPing(guild, itemsOrTypes) {
    const query = SQL`SELECT text FROM pings WHERE guild_id=${guild.id} AND item_or_type in (${itemsOrTypes})`;
    const res = await this.db.query(query);
    if (res[0].length === 0) {
      return '';
    }
    return res[0]
      .map(result => result.text).join(', ');
  }

  async getPingsForGuild(guild) {
    if (guild) {
      const query = SQL`SELECT item_or_type, text FROM pings WHERE guild_id=${guild.id}`;
      const res = await this.db.query(query);

      if (res[0].length === 0) {
        return [];
      }
      return res[0]
        .map(result => ({ text: result.text, thing: result.item_or_type }));
    }
    return [];
  }

  /**
   * Removes a ping message
   * @param {Guild} guild The guild where the ping message is currently being sent
   * @param {string} itemOrType The item or event type associated to the ping message
   * @returns {Promise}
   */
  async removePing(guild, itemOrType) {
    if (guild) {
      const query = SQL`DELETE FROM pings WHERE guild_id = ${guild.id} AND item_or_type = ${itemOrType};`;
      return this.db.query(query);
    }
    return false;
  }

  /**
   * Returns all the channels that should get a notification for the items in the list
   * @param {string} type The type of the event
   * @param {string} platform The platform of the event
   * @param {Array.<string>} items The items in the reward that is being notified
   * @returns {Promise.<Array.<{channel_id: string, webhook: string}>>}
   */
  async getNotifications(type, platform, items) {
    try {
      const query = SQL`SELECT DISTINCT channels.id as channelId
          FROM type_notifications`
        .append(items && items.length > 0 ?
          SQL` INNER JOIN item_notifications ON type_notifications.channel_id = item_notifications.channel_id` : SQL``)
        .append(SQL` INNER JOIN channels ON channels.id = type_notifications.channel_id`)
        .append(SQL` INNER JOIN settings ON channels.id = settings.channel_id`)
        .append(SQL`
        WHERE type_notifications.type = ${String(type)}
          AND MOD(IFNULL(channels.guild_id, 0) >> 22, ${this.bot.shardCount}) = ${this.bot.shardId}
          AND settings.setting = "platform"  AND settings.val = ${platform || 'pc'} `)
        .append(items && items.length > 0 ? SQL`AND item_notifications.item IN (${items})
          AND item_notifications.channel_id = settings.channel_id;` : SQL`;`);
      return this.db.query(query);
    } catch (e) {
      this.logger.error(e);
      return [];
    }
  }

  /**
   * Returns the items that the channel is tracking
   * @param {Channel} channel A Discord channel
   * @returns {Promise.<Array.<string>>}
   */
  async getTrackedItems(channel) {
    const query = SQL`SELECT item FROM item_notifications WHERE channel_id = ${channel.id};`;
    const res = await this.db.query(query);
    return res[0].map(r => r.item);
  }

  /**
   * Returns the event types that the channel is tracking
   * @param {Channel} channel A Discord channel
   * @returns {Promise.<Array.<string>>}
   */
  async getTrackedEventTypes(channel) {
    const query = SQL`SELECT type FROM type_notifications WHERE channel_id = ${channel.id};`;
    const res = await this.db.query(query);
    return res[0].map(r => r.type);
  }

  /**
   * Enables or disables a command for an individual member in a channel
   * @param {GuildChannel} channel - A discord guild channel
   * @param {GuildMember} member - A discord guild member
   * @param {string} commandId - The ID of the command to set the permission for
   * @param {boolean} allowed - Whether this member should be allowed to use this command
   * @returns {Promise}
   */
  async setChannelPermissionForMember(channel, member, commandId, allowed) {
    const query = SQL`INSERT INTO channel_permissions VALUES
      (${channel.id}, ${member.id}, TRUE, ${commandId}, ${allowed})
      ON DUPLICATE KEY UPDATE allowed = ${allowed};`;
    return this.db.query(query);
  }

  /**
   * Enables or disables a command for a role in a channel
   * @param {GuildChannel} channel - A discord guild channel
   * @param {Role} role - A discord role
   * @param {string} commandId - The ID of the command to set the permission for
   * @param {boolean} allowed - Whether this member should be allowed to use this command
   * @returns {Promise}
   */
  async setChannelPermissionForRole(channel, role, commandId, allowed) {
    const query = SQL`INSERT INTO channel_permissions VALUES
      (${channel.id}, ${role.id}, FALSE, ${commandId}, ${allowed})
      ON DUPLICATE KEY UPDATE allowed = ${allowed};`;
    return this.db.query(query);
  }

  /**
   * Enables or disables a command for an individual member in a guild
   * @param {Guild} guild - A discord guild
   * @param {GuildMember} member - A discord guild member
   * @param {string} commandId - The ID of the command to set the permission for
   * @param {boolean} allowed - Whether this member should be allowed to use this command
   * @returns {Promise}
   */
  async setGuildPermissionForMember(guild, member, commandId, allowed) {
    const query = SQL`INSERT INTO guild_permissions VALUES
      (${guild.id}, ${member.id}, TRUE, ${commandId}, ${allowed})
      ON DUPLICATE KEY UPDATE allowed = ${allowed};`;
    return this.db.query(query);
  }

  /**
   * Enables or disables a command for a role in a channel
   * @param {Guild} guild - A discord guild
   * @param {Role} role - A discord role
   * @param {string} commandId - The ID of the command to set the permission for
   * @param {boolean} allowed - Whether this member should be allowed to use this command
   * @returns {Promise}
   */
  async setGuildPermissionForRole(guild, role, commandId, allowed) {
    const query = SQL`INSERT INTO guild_permissions VALUES
      (${guild.id}, ${role.id}, FALSE, ${commandId}, ${allowed})
      ON DUPLICATE KEY UPDATE allowed = ${allowed};`;
    return this.db.query(query);
  }

  /**
   * Stops tracking all event types in a channel (disables all notifications)
   * @param {Channel} channel - A Discord channel
   * @returns {Promise}
   */
  async stopTracking(channel) {
    const query = SQL`DELETE FROM type_notifications WHERE channel_id = ${channel.id};`;
    return this.db.query(query);
  }

  /**
   * Gets whether or not a user is allowed to use a particular command in a channel
   * @param {Channel} channel - A Discord channel
   * @param {string} memberId - String representing a user identifier
   * @param {string} commandId - String representing a command identifier
   * @returns {Promise}
   */
  async getChannelPermissionForMember(channel, memberId, commandId) {
    const query = SQL`SELECT allowed FROM channel_permissions
    WHERE channel_id = ${channel.id} AND command_id = ${commandId}
    AND is_user = true AND target_id = ${memberId}`;
    const res = await this.db.query(query);

    if (!res || res[0].length === 0) {
      return 'none';
    }
    return res.rows[0].allowed;
  }

  /**
   * Gets whether or not a role is allowed to use a particular command in a channel
   * @param {Channel} channel A Discord channel
   * @param {string} role String representing a user identifier
   * @param {string} commandId String representing a command identifier
   * @returns {Promise}
   */
  async getChannelPermissionForRole(channel, role, commandId) {
    const query = SQL`SELECT allowed FROM channel_permissions
    WHERE channel_id = ${channel.id} AND command_id = ${commandId}
    AND is_user = false AND target_id = ${role.id}`;
    const res = await this.db.query(query);

    if (!res || res[0].length === 0) {
      return 'none';
    }
    return res.rows[0].allowed === 1;
  }

  /**
   * Gets whether or not a role in the user's
   * roles allows the user to use a particular command in a channel
   * @param {Channel} channel - A Discord channel
   * @param {User} user - A Discord user
   * @param {string} commandId - A command id for designating
   *                           a command to check permissions for
   * @returns {Promise}
   */
  async getChannelPermissionForUserRoles(channel, user, commandId) {
    const userRoles = channel.type === 'text' ? channel.guild.member(user).roles : {};
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
    const res = await this.db.query(query);
    if (res[0].length === 0) {
      return 'none';
    }
    return res[0][0].allowed;
  }

  /**
   * Gets whether or not a user is allowed to use a particular command in a guild
   * @param {Guild} guild - A Discord guild
   * @param {string} memberId - String representing a user identifier
   * @param {string} commandId - String representing a command identifier
   * @returns {Promise}
   */
  async getGuildPermissionForMember(guild, memberId, commandId) {
    const query = SQL`SELECT allowed FROM guild_permissions
    WHERE channel_id = ${guild.id} AND command_id = ${commandId}
    AND is_user = true AND target_id = ${memberId}`;
    const res = await this.db.query(query);
    if (res.rows.length === 0) {
      throw new Error(`The guild permissions for the guild ${guild.id}
         for member ${memberId} was not found in the database`);
    }
    return res.rows[0].allowed;
  }

  /**
   * Gets whether or not a role is allowed to use a particular command in a guild
   * @param {Guild} guild - A Discord guild
   * @param {string} role String representing a user identifier
   * @param {string} commandId String representing a command identifier
   * @returns {Promise}
   */
  async getGuildPermissionForRole(guild, role, commandId) {
    const query = SQL`SELECT allowed FROM guild_permissions
    WHERE channel_id = ${guild.id} AND command_id = ${commandId}
    AND is_user = false AND target_id = ${role.id}`;
    const res = await this.db.query(query);
    if (res.rows.length === 0) {
      throw new Error(`The guild permissions for the guild ${guild.id}
         for member ${role.id} was not found in the database`);
    }
    return res.rows[0].allowed;
  }

  /**
   * Remove guild from database
   * @param  {snowflake} guild Guild to be removed from database
   * @returns {Promise.<string>} status of removal
   */
  async removeGuild(guild) {
    const query = SQL`DELETE FROM channels WHERE guild_id = ${guild.id}`;
    await this.db.query(query);
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
    return Promise.all(results);
  }

  async removeSettings(channelId) {
    const query = SQL`DELETE FROM settings WHERE settings.channel_id=${channelId};`;
    return this.db.query(query);
  }

  async removePrivateChannels(guild) {
    const query = SQL`DELETE FROM private_channels WHERE guild_id=${guild.id}`;
    return this.db.query(query);
  }

  /**
   * Remove permissions corresponding to the guild id
   * @param  {snowflake} guildId guild identifier for removal
   * @returns {Promise.<string>} status of removal
   */
  async removeGuildPermissions(guildId) {
    const query = SQL`DELETE FROM guild_permissions WHERE guild_id = ${guildId}`;
    return this.db.query(query);
  }

  /**
   * Remove permissions corresponding to the guild id
   * @param  {snowflake} channelId channel identifier for removal
   * @returns {Promise.<string>} status of removal
   */
  async removeChannelPermissions(channelId) {
    const query = SQL`DELETE FROM channel_permissions WHERE channel_id = ${channelId}`;
    return this.db.query(query);
  }

  /**
   * Remove permissions corresponding to the channel id
   * @param  {snowflake} channelId channel identifier for removal
   * @returns {Promise.<string>} status of removal
   */
  async removeItemNotifications(channelId) {
    const query = SQL`DELETE FROM item_notifications WHERE channel_id = ${channelId}`;
    return this.db.query(query);
  }

  /**
   * Remove pings corresponding to the guild id
   * @param  {snowflake} guildId guild identifier for removal
   * @returns {Promise.<string>} status of removal
   */
  async removePings(guildId) {
    const query = SQL`DELETE FROM pings WHERE guild_id = ${guildId}`;
    return this.db.query(query);
  }

  /**
   * Set the notified ids for a given platform and shard id
   * @param {string} platform    platform corresponding to notified ids
   * @param {number} shardId     shard id corresponding to notified ids
   * @param {JSON} notifiedIds list of oids that have been notifiedIds
   * @returns {Promise}
   */
  async setNotifiedIds(platform, shardId, notifiedIds) {
    const query = SQL`INSERT INTO notified_ids VALUES
      (${shardId}, ${platform}, JSON_ARRAY(${notifiedIds}))
      ON DUPLICATE KEY UPDATE id_list = JSON_ARRAY(${notifiedIds});`;
    return this.db.query(query);
  }

  /**
   * Get list of notified ids for the given platform and shard id
   * @param  {string} platform Platform
   * @param  {number} shardId  Identifier of the corresponding shard
   * @returns {Promise.<Array>} Array of notified oids
   */
  async getNotifiedIds(platform, shardId) {
    const query = SQL`SELECT id_list
      FROM notified_ids
      WHERE shard_id=${shardId} AND platform=${platform};`;
    const res = await this.db.query(query);
    if (res[0].length === 0) {
      return [];
    }
    return res[0][0].id_list;
  }

  /**
   * Set the joinable roles for a guild
   * @param {Guild} guild Guild to set joinable roles for
   * @param {Array.<string>} roles Array of role ids to set
   * @returns {Promise}
   */
  async setRolesForGuild(guild, roles) {
    const query = SQL`INSERT INTO guild_joinable_roles VALUES
      (${guild.id}, JSON_ARRAY(${roles}))
      ON DUPLICATE KEY UPDATE id_list = JSON_ARRAY(${roles});`;
    return this.db.query(query);
  }

  /**
   * Get the roles that can be joined for a guild
   * @param  {Guild} guild [description]
   * @returns {Promise.<Array.<Role>>} Promise of array of roles that are joinable
   */
  async getRolesForGuild(guild) {
    const query = SQL`SELECT id_list
      FROM guild_joinable_roles
      WHERE guild_id=${guild.id}`;
    const res = await this.db.query(query);
    if (res[0][0]) {
      const validListIds = res[0][0].id_list
        .filter(id => typeof this.bot.client.guilds.get(guild.id).roles.get(id) !== 'undefined');
      const validList = validListIds
        .map(id => this.bot.client.guilds.get(guild.id).roles.get(id));
      return validList;
    }
    return [];
  }

  /**
   * Get a dump of allowed and denied permissions
   * @param  {Guild} guild guild to fetch settings for
   * @returns {Object}       Data about allowed data
   */
  async permissionsForGuild(guild) {
    const query = SQL`SELECT * FROM guild_permissions WHERE guild_id = ${guild.id}`;
    const res = await this.db.query(query);
    if (res[0]) {
      return res[0].map(value => ({
        level: 'guild',
        command: value.command_id,
        isAllowed: value.allowed,
        type: value.is_user ? 'user' : 'role',
        appliesToId: value.target_id,
      }));
    }
    return [];
  }

  /**
   * Get a dump of allowed and denied permissions
   * @param  {Channel} channel channel to fetch settings for
   * @returns {Object}       Data about allowed data
   */
  async permissionsForChannel(channel) {
    const query = SQL`SELECT * FROM channel_permissions WHERE channel_id = ${channel.id}`;
    const res = await this.db.query(query);
    if (res[0]) {
      return res[0].map(value => ({
        level: 'channel',
        command: value.command_id,
        isAllowed: value.allowed,
        type: value.is_user ? 'user' : 'role',
        appliesToId: value.target_id,
      }));
    }
    return [];
  }

  async addPrivateRoom(guild, textChannel, voiceChannel, category) {
    const query = SQL`INSERT INTO private_channels (guild_id, text_id, voice_id, category_id) VALUES (${guild.id}, ${textChannel.id}, ${voiceChannel.id}, ${category.id})`;
    return this.db.query(query);
  }

  async deletePrivateRoom(room) {
    const {
      guild, textChannel, voiceChannel, category,
    } = room;
    const query = SQL`DELETE FROM private_channels WHERE guild_id = ${guild.id} AND text_id = ${textChannel.id} AND voice_id = ${voiceChannel.id} AND category_id= ${category.id}`;
    return this.db.query(query);
  }

  async getPrivateRooms() {
    const query = SQL`SELECT guild_id, text_id, voice_id, category_id, created_at as crt_sec  FROM private_channels WHERE MOD(IFNULL(guild_id, 0) >> 22, ${this.bot.shardCount}) = ${this.bot.shardId}`;
    const res = await this.db.query(query);
    if (res[0]) {
      return res[0].map(value => ({
        guild: this.bot.client.guilds.get(value.guild_id),
        textChannel: this.bot.client.channels.get(value.text_id),
        voiceChannel: this.bot.client.channels.get(value.voice_id),
        category: this.bot.client.channels.get(value.category_id),
        createdAt: value.crt_sec,
        guildId: value.guild_id,
        textId: value.guild_id,
        voiceId: value.guild_id,
        categoryId: value.guild_id,
      }));
    }
    return [];
  }

  async getCommandContext(channel) {
    this.getChannelSetting(channel, 'prefix'); // ensure it's set at some point
    const query = SQL`SELECT setting, val FROM settings where channel_id = ${channel.id} and setting in ('prefix', 'allowCustom', 'allowInline', 'webhookId', 'webhookToken', 'webhookName', 'webhookAvatar');`;
    const res = await this.db.query(query);
    let context = {
      webhook: {},
    };
    if (res[0]) {
      res[0].map(row => ({
        setting: row.setting,
        value: row.val,
      })).forEach((row) => {
        if (row.setting.indexOf('webhook') === -1) {
          context[`${row.setting}`] = row.value;
        } else {
          context.webhook[`${row.setting.replace('webhook', '').toLowerCase()}`] = row.value;
        }
      });
      if (!context.prefix) {
        context.prefix = this.defaults.prefix;
      }
      if (typeof context.allowCustom === 'undefined') {
        context.allowCustom = this.defaults.allowCustom ? '1' : '0';
      }
      if (typeof context.allowInline === 'undefined') {
        context.allowInline = this.defaults.allowInline ? '1' : '0';
      }
    } else {
      context = {
        prefix: this.defaults.prefix,
        allowCustom: this.defaults.allowCustom ? '1' : '0',
        allowInline: this.defaults.allowInline ? '1' : '0',
      };
    }
    return context;
  }

  async getCustomCommands() {
    this.logger.debug(`Shards: ${this.bot.shardCount}, this shard's id: ${this.bot.shardId}`);
    const query = SQL`SELECT * FROM custom_commands WHERE (guild_id >> 22) % ${this.bot.shardCount} = ${this.bot.shardId}`;
    const res = await this.db.query(query);
    if (res[0]) {
      return res[0].map(value =>
        new CustomCommand(this.bot, value.command, value.response, value.guild_id));
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

  /**
   * Clear welcome messages for a guild
   * @param {Guild} guild The guild
   * @param {boolean} isDm whether or not the message to be cleared is the dm or in-chat message
   * @returns {Promise}
   */
  async clearWelcomeForGuild(guild, isDm) {
    const query = SQL`DELETE FROM welcome_messages WHERE guild_id=${guild.id} && is_dm=${isDm}`;
    return this.db.query(query);
  }

  /**
   * Sets a ping message for an item or event type in a guild
   * @param {Message} message Message to derive information for guild and channel
   * @param {boolean} isDm whether or not this is for the dm welcome
   * @param {string} text The text of the ping message
   * @returns {Promise}
   */
  async setWelcome(message, isDm, text) {
    const query = SQL`INSERT INTO welcome_messages (guild_id, is_dm, channel_id, message) VALUES (${message.guild.id}, ${isDm}, ${message.channel.id}, ${text})
      ON DUPLICATE KEY UPDATE message = ${text};`;
    return this.db.query(query);
  }

  async getWelcomes(guild) {
    if (guild) {
      const query = SQL`SELECT * FROM welcome_messages WHERE guild_id=${guild.id}`;
      const res = await this.db.query(query);
      if (res[0]) {
        return res[0].map(value =>
          ({
            isDm: value.is_dm,
            message: value.message,
            channel: this.bot.client.channels.get(value.channel_id),
          }));
      }
      return [];
    }
    return [];
  }

  async addNewBuild(title, body, image, owner) {
    const buildId = makeId();
    const query = SQL`INSERT INTO builds VALUES (${buildId}, ${title}, ${body}, ${image}, ${owner.id})
      ON DUPLICATE KEY UPDATE title=${title}, body=${body}, image=${image};`;
    await this.db.query(query);
    return {
      id: buildId, title, body, url: image, owner,
    };
  }

  async getBuild(buildId) {
    if (buildId) {
      const query = SQL`SELECT * FROM builds WHERE build_id=${buildId};`;
      const res = await this.db.query(query);
      if (res[0] && res[0][0]) {
        const result = res[0][0];
        return {
          title: result.title,
          body: result.body,
          url: result.image,
          id: result.build_id,
          owner: this.bot.client.users.get(result.owner_id) || result.owner_id,
          owner_id: result.owner_id,
        };
      }
    }
    return {
      id: '',
      title: 'No Such Build',
      body: '',
      url: '',
      owner: '',
    };
  }

  async deleteBuild(buildId) {
    const query = SQL`DELETE FROM builds WHERE build_id=${buildId};`;
    return this.db.query(query);
  }

  async getBuilds(owner, author) {
    const query = SQL`SELECT * FROM builds WHERE owner_id LIKE ${owner ? '%' : author.id};`;
    const res = await this.db.query(query);
    if (res[0]) {
      return res[0].map(build => ({
        id: build.build_id,
        owner: this.bot.client.users.get(build.owner_id) || build.owner_id,
        title: build.title,
      }));
    }
    return [];
  }

  async setBuildFields(buildId, { title = undefined, body = undefined, image = undefined }) {
    const setTokens = [];
    if (title) {
      setTokens.push(`title = '${title.trim().replace(/'/ig, '\\\'')}'`);
    }
    if (body) {
      setTokens.push(`body = '${body.trim().replace(/'/ig, '\\\'')}'`);
    }
    if (image) {
      setTokens.push(`image = '${image.trim().replace(/'/ig, '\\\'')}'`);
    }
    if (setTokens.length > 0) {
      const query = `UPDATE builds SET ${setTokens.join(', ')} WHERE build_id='${buildId}';`;
      return this.db.query(query);
    }
    return false;
  }

  async deleteWebhooksForChannel(channelId) {
    const query = SQL`DELETE FROM settings WHERE channel_id=${channelId} and setting like "webhook%";`;
    return this.db.query(query);
  }
}

module.exports = Database;
