'use strict';

const { Rest } = require('@spectacles/rest');

const logger = require('../Logger');

class RESTWrapper {
  constructor() {
    this.client = new Rest(process.env.TOKEN, { retryLimit: 0, ua: 'Genesis Notifier' });
  }

  async init() {
    this.user = await this.client.get('/users/@me');
  }

  /**
   * Get the first webhook for a channel.
   * @param  {string}  channelId Channel id to get/create a webhook from/for
   * @returns {Promise.<Object|undefined>}           [description]
   */
  async getWebhook(channelId) {
    try {
      let webhooks = await this.client.get(`/channels/${channelId}/webhooks`);
      if (webhooks.length) {
        webhooks = webhooks.filter(webhook => webhook && webhook.type === 1);
        return webhooks[0];
      }
      return this.client.post(`/channels/${channelId}/webhooks`);
    } catch (e) {
      logger.error(e);
      return undefined;
    }
  }
}

module.exports = RESTWrapper;
