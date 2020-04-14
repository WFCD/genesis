'use strict';

/**
 * Broadcast updates out to subscribing channels
 * @param {Discord.Client} client         bot client
 * @param {Database} settings settings object for fetching data
 *    information about current channel, guild, and bot settings
 * @param {MessageManager} messageManager manages messages, including sending, deleing, and webhooks
 */
class Broadcaster {
  constructor({
    client = undefined, settings = undefined, messageManager = undefined,
  }) {
    this.client = client;
    this.settings = settings;
    this.messageManager = messageManager;
  }

  /**
   * Broadcast embed to all channels for a platform and type
   * @param  {Object} embed      Embed to send to a channel
   * @param  {string} platform   Platform of worldstate
   * @param  {string} type       Type of new data to notify
   * @param  {Array}  [items=[]] Items to broadcast
   * @param  {number} [deleteAfter=0] Amount of time to delete broadcast after
   * @returns {Array.<Object>} values for successes
   */
  async broadcast(embed, platform, type, items = [], deleteAfter = 0) {
    const channels = await this.settings.getNotifications(type, platform, items);
    embed.bot = undefined; // eslint-disable-line no-param-reassign

    return Promise.all(channels.map(async (result) => {
      const channel = this.client.channels.cache.get(result.channelId);

      if (channel) {
        if (channel.type === 'text') {
          return this.sendWithPrepend(channel, embed, type, items, deleteAfter);
        }
        if (channel.type === 'dm') {
          return this.messageManager.embedToChannel(channel, embed, '', deleteAfter);
        }
      }
      return undefined;
    }));
  }

  async sendWithoutPrepend(channel, embed, deleteAfter) {
    const ctx = await this.settings.getCommandContext(channel);
    ctx.deleteAfterDuration = deleteAfter;
    return this.messageManager.webhook(
      ctx,
      { embed: this.messageManager.webhookWrapEmbed(embed) },
    );
  }

  async sendWithPrepend(channel, embed, type, items, deleteAfter) {
    const prepend = await this.settings
      .getPing(channel.guild, (items || []).concat([type]));
    const ctx = await this.settings.getCommandContext(channel);
    if (embed.locale && ctx.language.toLowerCase() !== embed.locale.toLowerCase()) return false;
    ctx.deleteAfterDuration = deleteAfter;

    await this.messageManager.webhook(
      ctx,
      { text: prepend, embed: this.messageManager.webhookWrapEmbed(embed, ctx) },
    );
    return true;
  }
}

module.exports = Broadcaster;
