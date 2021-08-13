'use strict';

const SQL = require('sql-template-strings');
// eslint-disable-next-line no-unused-vars
const Discord = require('discord.js');

/**
 * Database Mixin for managing settings
 * @mixin
 */
class SettingsQueries {
  constructor(db) {
    this.db = db;
  }

  /**
   * Get the guilds stored in the database
   * @returns {Promise.<Object>} Object of guild entries
   */
  async getGuilds() {
    const [rows] = await this.query(SQL`select id, guild_id from channels;`);
    const guilds = {};
    rows.forEach((row) => {
      if (!guilds[row.guild_id]) {
        guilds[row.guild_id] = {
          id: row.guild_id,
          channels: [],
        };
      }
      guilds[row.guild_id].channels.push(row.id);
    });
    return guilds;
  }

  /**
   * Get a guild-wide setting
   * @param {Discord.Guild} guild to get settings for
   * @param {string} setting setting to fetch
   * @returns {string} setting value
   */
  async getGuildSetting(guild, setting) {
    if (guild) {
      const query = SQL`SELECT val FROM settings, channels WHERE channel_id=channels.id and channels.guild_id=${guild.id} and settings.setting=${setting}`;
      const [rows] = await this.query(query);
      if (!rows.length) {
        await this.setGuildSetting(guild, setting, this.defaults[`${setting}`]);
        return this.defaults[`${setting}`];
      }
      await this.setGuildSetting(guild, setting, rows[0].val);
      return rows[0].val;
    }
    return this.defaults[setting];
  }

  async checkWebhookAndReturn(channel, setting) {
    if (!/webhook/.test(setting)) {
      await this.setChannelSetting(channel, setting, this.defaults[setting]);
      return this.defaults[setting];
    }
    return undefined;
  }

  async getChannelSettings(channel, settings) {
    if (!channel.id) {
      channel = { id: channel }; // eslint-disable-line no-param-reassign
    }
    const query = SQL`SELECT val, setting FROM settings WHERE settings.channel_id = ${channel.id} and settings.setting in (${settings})`;
    const [rows] = await this.query(query);
    if (!rows.length) {
      return {};
    }
    const values = {};
    rows.forEach((row) => {
      values[row.setting] = row.val;
    });
    return values;
  }

  /**
   * Get a setting for a particular channel
   * @param {Channel} channel channel to get the setting for
   * @param {string} setting name of the setting to get
   * @returns {Promise} setting
   */
  async getChannelSetting(channel, setting) {
    if (channel) {
      if (!channel.id) {
        channel = { id: channel }; // eslint-disable-line no-param-reassign
      }
      const query = SQL`SELECT val FROM settings WHERE settings.channel_id=${channel.id} and settings.setting=${setting};`;
      const [rows] = await this.query(query);
      if (!rows.length) {
        if (channel.type === 'GUILD_TEXT') {
          await this.addGuildTextChannel(channel);
        } else {
          await this.addDMChannel(channel);
        }
        return this.checkWebhookAndReturn(channel, setting);
      }
      return rows[0].val;
    }
    return undefined;
  }

  async setChannelWebhook(channel, webhook) {
    if (!channel.id) {
      channel = { id: channel }; // eslint-disable-line no-param-reassign
    }
    if (webhook.id && webhook.token && webhook.name && webhook.avatar) {
      const query = SQL`INSERT INTO settings (channel_id, setting, val)
      VALUES (${channel.id}, 'webhookId', ${webhook.id}),
      (${channel.id}, 'webhookToken', ${webhook.token}),
      (${channel.id}, 'webhookName', ${webhook.name}),
      (${channel.id}, 'webhookAvatar', ${webhook.avatar})
      ON DUPLICATE KEY UPDATE
        val = Values(val)`;

      return this.query(query);
    }
    return false;
  }

  async getChannelWebhook(channel) {
    if (!channel.id) {
      channel = { id: channel }; // eslint-disable-line no-param-reassign
    }
    const query = SQL`SELECT setting, val FROM settings where channel_id = ${channel.id} and setting in ('webhookId', 'webhookToken', 'webhookName', 'webhookAvatar');`;
    const [rows] = await this.query(query);
    let webhook = {};
    if (rows) {
      rows
        .map(row => ({
          setting: row.setting,
          value: row.val,
        }))
        .forEach((row) => {
          if (row.setting.indexOf('webhook') > -1) {
            webhook[`${row.setting.replace('webhook', '').toLowerCase()}`] = row.value;
          }
        });

      if (!webhook.avatar) {
        webhook.avatar = this.defaults.avatar;
      }
      if (!webhook.name) {
        webhook.name = this.defaults.username;
      }
      if (!(webhook.id && webhook.token)) {
        webhook = undefined;
      }
    } else {
      webhook = undefined;
    }
    return webhook;
  }

  /**
   * Get a setting for a particular channel
   * @param {Channel} channel channel to get the setting for
   * @param {string} setting name of the setting to set
   * @param {string|boolean} value value of the setting to be set
   * @returns {Promise} setting
   */
  async setChannelSetting(channel, setting, value) {
    if (typeof setting === 'undefined' || typeof value === 'undefined') return false;
    if (!channel.id) {
      channel = { id: channel }; // eslint-disable-line no-param-reassign
    }
    const query = SQL`INSERT IGNORE INTO settings (channel_id, setting, val) VALUE (${channel.id},${setting},${value}) ON DUPLICATE KEY UPDATE val=${value};`;
    return this.query(query);
  }

  async deleteChannelSetting(channel, setting) {
    if (typeof setting === 'undefined') return false;
    if (!channel.id) {
      channel = { id: channel }; // eslint-disable-line no-param-reassign
    }
    const query = SQL`DELETE FROM settings where channel_id = ${channel.id} and setting=${setting};`;
    return this.query(query);
  }

  /**
   * Resets the custom prefix for this guild to the bot's globally configured prefix
   * @param {Guild} guild The Discord guild for which to set the response setting
   * @param {string} setting Name of the setting to set
   * @param {string|boolean} value value of the setting to be set
   * @returns {Promise}
   */
  async setGuildSetting(guild, setting, value) {
    if (typeof setting === 'undefined' || typeof value === 'undefined') return false;
    const promises = [];
    guild.channels.cache.forEach((channel) => {
      promises.push(this.setChannelSetting(channel, setting, value));
    });
    return Promise.all(promises);
  }

  /**
   * Delete a guild setting
   * @param  {Discord.Guild}  guild   guild to delete for
   * @param  {strimg}  setting string key
   * @returns {Promise}         resolution of deletion
   */
  async deleteGuildSetting(guild, setting) {
    const promises = [];
    guild.channels.cache.forEach((channel) => {
      promises.push(this.deleteChannelSetting(channel, setting));
    });
    return Promise.all(promises);
  }

  async removeSettings(channelId) {
    const query = SQL`DELETE FROM settings WHERE settings.channel_id=${channelId};`;
    return this.query(query);
  }

  async deleteWebhooksForChannel(channelId) {
    const query = SQL`DELETE FROM settings WHERE channel_id=${channelId} and setting in ("webhookToken", "webhookId", "webhookAvatar", "webhookName");`;
    return this.query(query);
  }
}

module.exports = SettingsQueries;
