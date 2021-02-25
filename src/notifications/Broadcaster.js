'use strict';

const logger = require('../Logger');
const cachedEvents = require('../resources/cachedEvents');

/**
 * Broadcast updates out to subscribing channels
 * @param {Discord.Client} client         bot client
 * @param {Database} settings settings object for fetching data
 *    information about current channel, guild, and bot settings
 * @param {MessageManager} messageManager manages messages, including sending, deleing, and webhooks
 */
class Broadcaster {
  constructor({
    client = undefined, settings = undefined, messageManager = undefined, workerCache = undefined,
  }) {
    this.client = client;
    this.settings = settings;
    this.webhook = messageManager.webhook;
    this.shards = process.env.SHARDS;
    this.workerCache = workerCache;
  }

  wrap(embed, ctx) {
    return this.wraps([embed], ctx);
  }

  wraps(embeds, ctx) {
    return ctx.webhook && ctx.webhook.avatar
      ? {
        username: ctx.webhook.name,
        avatarURL: ctx.webhook.avatar,
        embeds,
      }
      : {
        username: this.settings.defaults.username,
        avatarURL: this.settings.defaults.avatar,
        embeds,
      };
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
    logger.silly(`broadcasting ${type}`);
    delete embed.bot;

    const guilds = this.workerCache.getKey('guilds');

    const channels = cachedEvents.includes(type)
      ? this.workerCache.getKey(`${type}:${platform}`)
      : await this.settings.getAgnosticNotifications(type, platform, items);
    if (!channels.length) {
      logger.silly(`No channels on ${platform} tracking ${type}... continuing`, 'WS');
      return;
    }

    for (const channelId of channels) {
      if (typeof channelId === 'undefined' || !channelId.length) continue;
      const ctx = await this.settings.getCommandContext(channelId);

      // localeCompare should return 0 if equal, so non-zero's will be truthy
      if (embed.locale && ctx.language.localeCompare(embed.locale)) {
        continue;
      }

      const glist = Object.entries(guilds)
        .filter(([, g]) => g.channels && g.channels.includes(channelId))[0];
      const guild = glist && glist.length ? glist[1] : null;

      if (!guild) {
        logger.info(`couldn't find guild for ${type} on ${channelId}`);
        continue;
      }

      try {
        const prepend = ''; // await this.settings.getPing(guild, (items || []).concat([type]));
        if (!embed.embeds) {
          await this.webhook(ctx, { text: prepend, embed: this.wrap(embed, ctx) });
        } else {
          await this.webhook(ctx, { text: prepend, embed });
        }
      } catch (e) {
        if (e.message && e.message.includes('Unknown Webhook')) {
          logger.warn(`Wiping webhook context for ${channelId}`);
          await this.settings.deleteWebhooksForChannel(channelId);
        } else {
          logger.error(e);
        }
      }
    }
  }
}

module.exports = Broadcaster;
