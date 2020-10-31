'use strict';

const { Rest } = require('@spectacles/rest');

const logger = require('../Logger');

const { assetBase } = require('../CommonFunctions');

const defaults = {
  username: process.env.DEF_USER || 'Genesis',
  avatar: `${assetBase}/avatar.png`,
};

class RESTWrapper {
  constructor() {
    this.client = new Rest(process.env.TOKEN, { retryLimit: 1, ua: 'Genesis Notifier' });
  }

  async init() {
    this.user = /*await this.client.get('/users/@me');*/ { username: 'Genesis' };
  }

  /**
   * Get the first webhook for a channel.
   * @param  {string}  channel Channel to get/create a webhook from/for
   * @returns {Promise.<Object|undefined>}           [description]
   */
  async getWebhook(channel) {
    try {
      let webhooks = await this.client.get(`/channels/${channel.id}/webhooks`);
      if (webhooks.length) {
        webhooks = webhooks.filter(webhook => webhook && webhook.type === 1);
        return webhooks[0];
      }
      return this.client.post(`/channels/${channel.id}/webhooks`, {
        name: defaults.username,
        avatar: defaults.avatar,
      });
    } catch (e) {
      logger.error(e);
      return undefined;
    }
  }

  async controlMessage(body) {
    return this.client.post(`/webhooks/${process.env.CONTROL_WH_ID}/${process.env.CONTROL_WH_TOKEN}`, body);
  }
}

module.exports = RESTWrapper;
