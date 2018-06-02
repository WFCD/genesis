'use strict';

const SQL = require('sql-template-strings');

class TrackingQueries {
  constructor(db) {
    this.db = db;
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
      if (channel && channel.id) {
        query.append(SQL`(${channel.id}, ${type})`).append(index !== (types.length - 1) ? ',' : ';');
      }
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
   * Remove item notifications corresponding to the channel id
   * @param  {snowflake} channelId channel identifier for removal
   * @returns {Promise.<string>} status of removal
   */
  async removeItemNotifications(channelId) {
    const query = SQL`DELETE FROM item_notifications WHERE channel_id = ${channelId}`;
    return this.db.query(query);
  }

  /**
   * Remove type notifications corresponding to the channel id
   * @param  {snowflake} channelId channel identifier for removal
   * @returns {Promise.<string>} status of removal
   */
  async removeTypeNotifications(channelId) {
    const query = SQL`DELETE FROM type_notifications WHERE channel_id = ${channelId}`;
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
}

module.exports = TrackingQueries;
