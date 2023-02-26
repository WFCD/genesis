import SQL from 'sql-template-strings';
import Discord from 'discord.js'; // eslint-disable-line no-unused-vars

/**
 * Database Mixin for notification system tracking queries
 * @mixin
 * @mixes Database
 */
export default class TrackingQueries {
  /**
   * Tracking option arrays
   * @typedef {Object} TrackingOptions
   * @property {Discord.ThreadChannel} [thread] thread channel to update
   * @property {Array<string>} items Tracked Items
   * @property {Array<string>} events Tracked Events
   */

  /**
   * Set all tracking options for a channel
   * @param {Discord.TextChannel} channel channel to set trackables for
   * @param {TrackingOptions} opts options to set for provided channel
   * @returns {Promise<void>}
   */
  async setTrackables(channel, { events, items, thread }) {
    const deleteItems = SQL`DELETE i FROM item_notifications AS i WHERE i.channel_id = ${channel.id}`;
    const deleteTypes = SQL`DELETE t FROM type_notifications AS t WHERE t.channel_id = ${channel.id}`;
    if (thread) {
      deleteItems.append(SQL` AND i.thread_id = ${thread.id}`);
      deleteTypes.append(SQL` AND t.thread_id = ${thread.id}`);
    } else {
      deleteItems.append(SQL` AND i.thread_id = 0`);
      deleteTypes.append(SQL` AND t.thread_id = 0`);
    }
    await this.query(deleteItems);
    await this.query(deleteTypes);
    if (events?.length) await this.trackEventTypes(channel, events, thread);
    if (items?.length) await this.trackItems(channel, items, thread);
  }

  /**
   * Enables notifications for items in a channel
   * @param {Discord.TextChannel} channel The channel where to enable notifications
   * @param {Array.<string>} items The items to track
   * @param {Discord.ThreadChannel} [thread] thread to notify
   * @returns {Promise}
   */
  async trackItems(channel, items, thread) {
    let query;
    if (!thread) {
      query = SQL`INSERT IGNORE INTO item_notifications (channel_id, item) VALUES `;
      items.forEach((item, index) => {
        query.append(SQL`(${channel.id}, ${item})`).append(index !== items.length - 1 ? ',' : ';');
      });
    } else {
      query = SQL`INSERT IGNORE INTO item_notifications (channel_id, item, thread_id) VALUES `;
      items.forEach((item, index) => {
        query.append(SQL`(${channel.id}, ${item},${thread.id})`).append(index !== items.length - 1 ? ',' : ';');
      });
    }

    return this.query(query);
  }

  /**
   * Disables notifications for items in a channel
   * @param {Discord.TextChannel} channel The channel where to enable notifications
   * @param {Array<string>} items The items to untrack
   * @param {Discord.ThreadChannel} [thread] contextual thread channel
   * @returns {Promise}
   */
  async untrackItems(channel, items, thread) {
    const query = SQL`DELETE FROM item_notifications WHERE channel_id = ${channel.id}`;
    if (thread) {
      query.append(SQL` AND thread_id = ${thread.id}`);
    } else {
      query.append(SQL` AND thread_id = 0`);
    }
    query.append(SQL` AND ( `);
    items.forEach((item, index) => {
      query.append(index > 0 ? '  OR ' : '').append(SQL`item = ${item}`);
    });
    query.append(SQL`);`);
    return this.query(query);
  }

  /**
   * Enables notifications for items in a channel
   * @param {Discord.TextChannel} channel The channel where to enable notifications
   * @param {Array<string>} types The types to track
   * @param {Discord.ThreadChannel} [thread] thread to notify
   * @returns {Promise}
   */
  async trackEventTypes(channel, types, thread) {
    let query;
    if (!thread) {
      query = SQL`INSERT IGNORE INTO type_notifications (channel_id, type) VALUES `;
      types.forEach((type, index) => {
        if (channel && channel.id) {
          query.append(SQL`(${channel.id}, ${type})`).append(index !== types.length - 1 ? ',' : ';');
        }
      });
    } else {
      query = SQL`INSERT IGNORE INTO type_notifications (channel_id, type, thread_id) VALUES `;
      types.forEach((type, index) => {
        if (channel && channel.id) {
          query.append(SQL`(${channel.id}, ${type}, ${thread.id})`).append(index !== types.length - 1 ? ',' : ';');
        }
      });
    }
    return this.query(query);
  }

  /**
   * Disables notifications for event types in a channel
   * @param {Discord.TextChannel} channel The channel where to enable notifications
   * @param {Array<string>} types The types to untrack
   * @param {Discord.ThreadChannel} [thread] contextual thread channel
   * @returns {Promise}
   */
  async untrackEventTypes(channel, types, thread) {
    const query = SQL`DELETE FROM type_notifications WHERE channel_id = ${channel.id}`;
    if (thread) {
      query.append(SQL` AND thread_id = ${thread.id}`);
    } else {
      query.append(SQL` AND thread_id = 0`);
    }
    query.append(SQL` AND ( `);
    types.forEach((type, index) => {
      query.append(index > 0 ? '  OR ' : '').append(SQL`type = ${type}`);
    });
    query.append(SQL`);`);
    return this.query(query);
  }

  /**
   * Returns the items that the channel is tracking
   * @param {Discord.TextChannel} channel A Discord channel
   * @param {Discord.ThreadChannel} [thread] contextual thread channel
   * @returns {Promise.<Array.<string>>}
   */
  async getTrackedItems(channel, thread) {
    const query = SQL`SELECT item FROM item_notifications WHERE channel_id = ${channel.id}`;
    if (thread) {
      query.append(SQL` AND thread_id = ${thread.id}`);
    }
    query.append(SQL`;`);
    const res = await this.query(query);
    return res[0].map((r) => r.item);
  }

  /**
   * Returns the event types that the channel is tracking
   * @param {Discord.TextChannel} channel A Discord channel
   * @param {Discord.ThreadChannel} [thread] contextual thread channel
   * @returns {Promise.<Array.<string>>}
   */
  async getTrackedEventTypes(channel, thread) {
    const query = SQL`SELECT type FROM type_notifications WHERE channel_id = ${channel.id}`;
    if (thread) {
      query.append(SQL` AND thread_id = ${thread.id}`);
    }
    query.append(SQL`;`);

    const [rows] = await this.query(query);
    return rows.map((r) => r.type);
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
}
