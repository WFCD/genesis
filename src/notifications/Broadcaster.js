'use strict';

const logger = require('../Logger');

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
    this.webhook = messageManager.webhook;
    this.wrap = messageManager.webhookWrapEmbed;
    this.shards = Number.parseInt(process.env.SHARDS || '1', 10);
  }

  /**
  * Broadcast embed to all channels for a platform and type
  * @param  {Object} embed      Embed to send to a channel
  * @param  {string} platform   Platform of worldstate
  * @param  {string} type       Type of new data to notify
  * @param  {Array}  [items=[]] Items to broadcast
  * @returns {Array.<Object>} values for successes
  */
  async broadcast(embed, platform, type, items = []) {
    delete embed.bot;
    const guilds = await this.settings.getGuilds();

    for (let shard = 0; shard < this.shards; shard += 1) {
      const channels = await this.settings
        .getAgnosticNotifications(type, platform, items, { shard, shards: this.shards });
      for (const result of channels) {
        const ctx = await this.settings.getCommandContext(result.channelId);
        const localeMatch = !(embed.locale
          && ctx.language.toLowerCase() !== embed.locale.toLowerCase());

        if (localeMatch) {
          const guild = Object.entries(guilds)
            .filter(([, g]) => g.channels.includes(result.channelId))[0][1];
          try {
            const prepend = await this.settings.getPing(guild, (items || []).concat([type]));
            if (!embed.embeds) {
              await this.webhook(ctx, { text: prepend, embed: this.wrap(embed, ctx) });
            } else {
              await this.webhook(ctx, { text: prepend, embed });
            }
          } catch (e) {
            logger.error(e);
          }
        }
      }
    }
  }
}

module.exports = Broadcaster;
