import SQL from 'sql-template-strings';

import logger from '../../utilities/Logger.js';
import { pingables } from '../../resources/index.js';

/**
 * Database Mixin for Pings queries
 * @mixin
 * @mixes Database
 */
export default class PingsQueries {
  /**
   * Enables or disables pings for an item in a channel
   * @param {Discord.TextChannel} channel The channel where to enable notifications
   * @param {string} item The item to set ping status for
   * @param {boolean} enabled true to enable pinging, false to disable
   * @returns {Promise}
   */
  async setItemPing(channel, item, enabled) {
    const query = SQL`UPDATE item_notifications SET ping = ${enabled} WHERE channel_id = ${channel.id}
      AND item = ${item};`;
    return this.query(query);
  }

  /**
   * Enables or disables pings for an event type in a channel
   * @param {Discord.TextChannel} channel The channel where to enable notifications
   * @param {string} type The event type to set ping status for
   * @param {boolean} enabled true to enable pinging, false to disable
   * @returns {Promise}
   */
  async setEventTypePing(channel, type, enabled) {
    const query = SQL`UPDATE type_notifications SET ping = ${enabled} WHERE channel_id = ${channel.id}
      AND type = ${type};`;
    return this.query(query);
  }

  /**
   * Sets a ping message for an item or event type in a guild
   * @param {Discord.Guild} guild The guild
   * @param {string} itemOrType The item or event type to set the ping message for
   * @param {string} text The text of the ping message
   * @returns {Promise}
   */
  async setPing(guild, itemOrType, text) {
    const query = SQL`INSERT INTO pings VALUES (${guild.id}, ${itemOrType}, ${text})
      ON DUPLICATE KEY UPDATE text = ${text};`;
    return this.query(query);
  }

  /**
   * Mass-sets ping messages for items and events specified in {#opts}
   * @param {Discord.Guild} guild guild to set them for
   * @param {TrackingOptions} opts containing events & items
   * @param {string} text prepend text to apply
   * @returns {Promise<mysql.Connection.query>}
   */
  async addPings(guild, opts, text) {
    const query = SQL`INSERT IGNORE INTO pings VALUES `;
    const combined = opts.events.concat(opts.items);
    combined.forEach((eventOrItem, index) => {
      query.append(SQL`(${guild.id}, ${eventOrItem}, ${text})`).append(index !== combined.length - 1 ? ',' : ';');
    });
    return this.query(query);
  }

  /**
   * Get all pings for a guild for the provided event types and items
   * @param  {Discord.Guild|string|Object} guild                 Guild to get pings for
   * @param  {Array.<string>} itemsOrTypes array of strings corresponding to event and reward types
   * @returns {Promise.<string>}            Promise of a string to prepend to a message
   */
  async getPing(guild, itemsOrTypes) {
    if (!guild) {
      return undefined;
    }

    if (guild.channels) {
      delete guild.channels;
      guild.id = guild['id']; // eslint-disable-line no-self-assign, dot-notation
    }

    if (!guild.id) {
      guild = { id: guild };
    }
    try {
      const query = SQL`SELECT text FROM pings WHERE guild_id=${guild.id} AND item_or_type in (${itemsOrTypes})`;
      const res = await this.query(query);
      if (!res[0].length) return '';
      return res[0].map((result) => result.text).join(', ');
    } catch (e) {
      logger.error(e);
      return '';
    }
  }

  async getAllPings() {
    let globalPings = {};
    await Promise.all(
      pingables.map(async (plist) => {
        const plistPings = await this.getGroupPings(plist);
        globalPings = {
          ...globalPings,
          ...plistPings,
        };
      })
    );
    return globalPings;
  }

  async getGroupPings(plist) {
    const pings = {};
    const query = SQL`SELECT guild_id, GROUP_CONCAT(text SEPARATOR ',') as ping
      FROM pings
      WHERE item_or_type in (${plist.split(',')})
      GROUP by guild_id
      ORDER by item_or_type asc`;
    const res = await this.query(query);
    const [rows] = res;

    if (rows) {
      rows.forEach((row) => {
        const id = `${row.guild_id}:${plist}`;
        pings[id] = row.ping;
      });
    }

    return pings;
  }

  async getPingsForGuild(guild) {
    if (guild) {
      const query = SQL`SELECT item_or_type, text FROM pings WHERE guild_id=${guild.id}`;
      const [rows] = await this.query(query);

      return rows.length ? rows.map((result) => ({ text: result.text, thing: result.item_or_type })) : [];
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
      return this.query(query);
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
        .append(
          items && items.length
            ? SQL` INNER JOIN item_notifications ON type_notifications.channel_id = item_notifications.channel_id`
            : SQL``
        )
        .append(SQL` INNER JOIN channels ON channels.id = type_notifications.channel_id`)
        .append(SQL` INNER JOIN settings ON channels.id = settings.channel_id`)
        .append(
          SQL` WHERE type_notifications.type = ${String(type)}
          AND MOD(IFNULL(channels.guild_id, 0) >> 22, ${this.bot.shardTotal}) in (${this.bot.shards})
          AND settings.setting = "platform"  AND (settings.val = ${platform || 'pc'} OR settings.val IS NULL) `
        )
        .append(
          items && items.length
            ? SQL` AND item_notifications.item IN (${items})
          AND item_notifications.channel_id = settings.channel_id;`
            : SQL`;`
        );
      return (await this.query(query))[0];
    } catch (e) {
      this.logger.error(e);
      return [];
    }
  }

  /**
   * Returns all the channels that should get a notification for the items in the list
   *    - ignores shard id, because this is for the standalone notifications
   * @param {string} type The type of the event
   * @param {string} platform The platform of the event
   * @param {Locale} locale language of the channel
   * @param {Array.<string>} [items] The items in the reward that is being notified
   * @returns {Promise.<Array.<{channelId: string, threadId: string}>>}
   */
  async getAgnosticNotifications({ type, platform, items, locale }) {
    if (this.scope.toLowerCase() !== 'worker') {
      return this.getNotifications(type, platform, items);
    }
    try {
      const query = SQL`SELECT DISTINCT
            channels.id as channelId,
            type_notifications.thread_id as typeThreadId`
        .append(
          items && items.length
            ? SQL`, 
            item_notifications.thread_id as itemThreadId`
            : SQL``
        )
        .append(
          SQL`
          FROM type_notifications
        `
        )
        .append(
          items && items.length
            ? SQL` INNER JOIN item_notifications ON type_notifications.channel_id = item_notifications.channel_id`
            : SQL``
        )
        .append(
          SQL`
          INNER JOIN channels ON channels.id = type_notifications.channel_id
          INNER JOIN settings as s1 ON channels.id = s1.channel_id
            AND s1.setting = "platform"  AND (s1.val = ${platform || 'pc'} OR s1.val IS NULL)
          INNER JOIN settings s2 on channels.id = s2.channel_id
            AND s2.setting = "language" AND s2.val = ${locale}
          INNER JOIN settings as ws1 ON channels.id = ws1.channel_id
            AND ws1.setting = "webhookToken" AND ws1.val IS NOT NULL
          INNER JOIN settings as ws2 ON channels.id = ws2.channel_id
            AND ws2.setting = "webhookId" AND ws2.val IS NOT NULL
          INNER JOIN settings as ws3 ON channels.id = ws3.channel_id
            AND ws3.setting = "webhookAvatar" AND ws3.val IS NOT NULL
          INNER JOIN settings as ws4 ON channels.id = ws4.channel_id
            AND ws4.setting = "webhookName" AND ws4.val IS NOT NULL `
        )
        .append(SQL` WHERE type_notifications.type = ${String(type)} `)
        .append(
          items && items.length
            ? SQL` AND item_notifications.item IN (${items})
          AND item_notifications.channel_id = channels.id;`
            : SQL`;`
        );
      const rows = (await this.query(query))[0];

      return rows
        .map((o) => ({
          channelId: o.channelId,
          threadId: o.typeThreadId || o.itemThreadId,
        }))
        .filter((o) => o.channelId);
    } catch (e) {
      this.logger.error(e);
      return [];
    }
  }

  /**
   * Remove pings corresponding to the guild id
   * @param  {Snowflake} guildId guild identifier for removal
   * @returns {Promise.<string>} status of removal
   */
  async removePings(guildId) {
    const query = SQL`DELETE FROM pings WHERE guild_id = ${guildId}`;
    return this.query(query);
  }

  /**
   * Set the notified ids for a given platform and shard id
   * @param {string} platform    platform corresponding to notified ids
   * @param {Array<string>} notifiedIds list of oids that have been notifiedIds
   * @returns {Promise}
   */
  async setNotifiedIds(platform, notifiedIds) {
    const query = SQL`INSERT INTO notified_ids VALUES
      (${this.clusterId}, ${platform}, JSON_ARRAY(${notifiedIds}))
      ON DUPLICATE KEY UPDATE id_list = JSON_ARRAY(${notifiedIds});`;
    return this.query(query);
  }

  /**
   * Get list of notified ids for the given platform and shard id
   * @param  {string} platform Platform
   * @returns {Promise.<Array>} Array of notified oids
   */
  async getNotifiedIds(platform) {
    const query = SQL`SELECT id_list
      FROM notified_ids
      WHERE shard_id=${this.clusterId} AND platform=${platform};`;
    const [rows] = await this.query(query);
    return rows.length ? rows[0].id_list : [];
  }
}
