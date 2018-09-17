'use strict';

const SQL = require('sql-template-strings');

class SettingsQueries {
  constructor(db) {
    this.db = db;
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

  async getChannelSettings(channel, settings) {
    const query = SQL`SELECT val, setting FROM settings WHERE settings.channel_id = ${channel.id} and settings.setting in (${settings})`;
    const results = await this.db.query(query);
    if (results[0].length === 0) {
      return {};
    }
    const values = {};
    results[0].forEach((row) => {
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
    return undefined;
  }

  async setChannelWebhook(channel, webhook) {
    const query = SQL`INSERT INTO settings (channel_id, setting, val)
    VALUES (${channel.id}, 'webhookId', ${webhook.id}),
    (${channel.id}, 'webhookToken', ${webhook.token}),
    (${channel.id}, 'webhookName', ${webhook.name}),
    (${channel.id}, 'webhookAvatar', ${webhook.avatar})
    ON DUPLICATE KEY UPDATE
      val = Values(val)`;

    return this.db.query(query);
  }

  async getChannelWebhook(channel) {
    const query = SQL`SELECT setting, val FROM settings where channel_id = ${channel.id} and setting in ('webhookId', 'webhookToken', 'webhookName', 'webhookAvatar');`;
    const res = await this.db.query(query);
    let webhook = {};
    if (res[0]) {
      res[0].map(row => ({
        setting: row.setting,
        value: row.val,
      })).forEach((row) => {
        if (row.setting.indexOf('webhook') > -1) {
          webhook[`${row.setting.replace('webhook', '').toLowerCase()}`] = row.value;
        }
      });

      if (!webhook.avatar) {
        webhook.avatar = this.bot.client.user.avatarURL.replace('?size=2048', '');
      }
      if (!webhook.name) {
        webhook.name = this.bot.client.user.username;
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
    const query = SQL`INSERT IGNORE INTO settings (channel_id, setting, val) VALUE (${channel.id},${setting},${value}) ON DUPLICATE KEY UPDATE val=${value};`;
    return this.db.query(query);
  }

  async deleteChannelSetting(channel, setting) {
    if (typeof setting === 'undefined') return false;
    const query = SQL`DELETE FROM settings where channel_id = ${channel.id} and setting=${setting};`;
    return this.db.query(query);
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
    guild.channels.forEach((channel) => {
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
    guild.channels.forEach((channel) => {
      promises.push(this.deleteChannelSetting(channel, setting));
    });
    return Promise.all(promises);
  }

  async removeSettings(channelId) {
    const query = SQL`DELETE FROM settings WHERE settings.channel_id=${channelId};`;
    return this.db.query(query);
  }

  async deleteWebhooksForChannel(channelId) {
    const query = SQL`DELETE FROM settings WHERE channel_id=${channelId} and setting like "webhook%";`;
    return this.db.query(query);
  }
}

module.exports = SettingsQueries;
