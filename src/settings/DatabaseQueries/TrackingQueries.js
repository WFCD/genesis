'use strict';

const SQL = require('sql-template-strings');
// eslint-disable-next-line no-unused-vars
const Discord = require('discord.js');
// eslint-disable-next-line no-unused-vars
const { Snowflake } = require('discord-api-types/v9');

/**
 * Database Mixin for notification system tracking queries
 * @mixin
 * @mixes Database
 */
module.exports = class TrackingQueries {
  /**
   * Tracking option arrays
   * @typedef {Object} TrackingOptions
   * @property {Array<string>} items Tracked Items
   * @property {Array<string>} events Tracked Events
   */

  /**
   * Set all tracking options for a channel
   * @param {Discord.TextChannel} channel channel to set trackables for
   * @param {TrackingOptions} opts options to set for provided channel
   * @returns {Promise<void>}
   */
  async setTrackables(channel, opts) {
    const deleteQuery = SQL`DELETE i, t
      FROM item_notifications i
        LEFT JOIN type_notifications t
          on i.channel_id = t.channel_id 
      WHERE i.channel_id = ${channel.id}`;
    await this.query(deleteQuery);
    if (opts?.events?.length) await this.trackEventTypes(channel, opts.events);
    if (opts?.items?.length) await this.trackItems(channel, opts.items);
  }

  /**
   * Enables notifications for an item in a channel
   * @param {Discord.TextChannel} channel The channel where to enable notifications
   * @param {string} item The item to track
   * @returns {Promise}
   */
  async trackItem(channel, item) {
    const query = SQL`INSERT IGNORE INTO item_notifications (channel_id, item) VALUES (${channel.id},${item});`;
    return this.query(query);
  }

  /**
   * Enables notifications for items in a channel
   * @param {Discord.TextChannel} channel The channel where to enable notifications
   * @param {Array.<string>} items The items to track
   * @returns {Promise}
   */
  async trackItems(channel, items) {
    const query = SQL`INSERT IGNORE INTO item_notifications (channel_id, item) VALUES `;
    items.forEach((item, index) => {
      query.append(SQL`(${channel.id}, ${item})`).append(index !== (items.length - 1) ? ',' : ';');
    });
    return this.query(query);
  }

  /**
   * Disables notifications for an item in a channel
   * @param {Discord.TextChannel} channel The channel where to enable notifications
   * @param {string} item The item to track
   * @returns {Promise}
   */
  async untrackItem(channel, item) {
    const query = SQL`DELETE FROM item_notifications WHERE channel_id = ${channel.id} AND item = ${item};`;
    return this.query(query);
  }

  /**
   * Disables notifications for items in a channel
   * @param {Discord.TextChannel} channel The channel where to enable notifications
   * @param {Array<string>} items The items to untrack
   * @returns {Promise}
   */
  async untrackItems(channel, items) {
    const query = SQL`DELETE FROM item_notifications WHERE channel_id = ${channel.id} AND (`;
    items.forEach((item, index) => {
      query.append(index > 0 ? '  OR ' : '').append(SQL`item = ${item}`);
    });
    query.append(SQL`);`);
    return this.query(query);
  }

  /**
   * Enables notifications for an event type in a channel
   * @param {Discord.TextChannel} channel The channel where to enable notifications
   * @param {string} type The item to track
   * @returns {Promise}
   */
  async trackEventType(channel, type) {
    const query = SQL`INSERT IGNORE INTO type_notifications (channel_id, type) VALUES (${channel.id},${type});`;
    return this.query(query);
  }

  /**
   * Enables notifications for items in a channel
   * @param {Discord.TextChannel} channel The channel where to enable notifications
   * @param {Array<string>} types The types to track
   * @returns {Promise}
   */
  async trackEventTypes(channel, types) {
    const query = SQL`INSERT IGNORE INTO type_notifications (channel_id, type) VALUES `;
    types.forEach((type, index) => {
      if (channel && channel.id) {
        query.append(SQL`(${channel.id}, ${type})`).append(index !== (types.length - 1) ? ',' : ';');
      }
    });
    return this.query(query);
  }

  /**
   * Disables notifications for an event type in a channel
   * @param {Discord.TextChannel} channel The channel where to enable notifications
   * @param {string} type The item to track
   * @returns {Promise}
   */
  async untrackEventType(channel, type) {
    const query = SQL`DELETE FROM type_notifications WHERE channel_id = ${channel.id} AND type = ${type};`;
    return this.query(query);
  }

  /**
   * Disables notifications for event types in a channel
   * @param {Discord.TextChannel} channel The channel where to enable notifications
   * @param {Array<string>} types The types to untrack
   * @returns {Promise}
   */
  async untrackEventTypes(channel, types) {
    const query = SQL`DELETE FROM type_notifications WHERE channel_id = ${channel.id} AND (`;
    types.forEach((type, index) => {
      query.append(index > 0 ? '  OR ' : '').append(SQL`type = ${type}`);
    });
    query.append(SQL`);`);
    return this.query(query);
  }

  /**
   * Returns the items that the channel is tracking
   * @param {Discord.TextChannel} channel A Discord channel
   * @returns {Promise.<Array.<string>>}
   */
  async getTrackedItems(channel) {
    const query = SQL`SELECT item FROM item_notifications WHERE channel_id = ${channel.id};`;
    const res = await this.query(query);
    return res[0].map(r => r.item);
  }

  /**
   * Returns the event types that the channel is tracking
   * @param {Discord.TextChannel} channel A Discord channel
   * @returns {Promise.<Array.<string>>}
   */
  async getTrackedEventTypes(channel) {
    const query = SQL`SELECT type FROM type_notifications WHERE channel_id = ${channel.id};`;
    const [rows] = await this.query(query);
    return rows.map(r => r.type);
  }

  /**
   * Remove item notifications corresponding to the channel id
   * @param  {Snowflake} channelId channel identifier for removal
   * @returns {Promise.<*>} status of removal
   */
  async removeItemNotifications(channelId) {
    const query = SQL`DELETE FROM item_notifications WHERE channel_id = ${channelId}`;
    return this.query(query);
  }

  /**
   * Remove type notifications corresponding to the channel id
   * @param  {Snowflake} channelId channel identifier for removal
   * @returns {Promise.<*>} status of removal
   */
  async removeTypeNotifications(channelId) {
    const query = SQL`DELETE FROM type_notifications WHERE channel_id = ${channelId}`;
    return this.query(query);
  }

  /**
   * Stops tracking all event types in a channel (disables all notifications)
   * @param {Channel} channel - A Discord channel
   * @returns {Promise}
   */
  async stopTracking(channel) {
    const query = SQL`DELETE FROM type_notifications WHERE channel_id = ${channel.id};`;
    return this.query(query);
  }
};
