import logger from '../utilities/Logger.js';
import { cachedEvents } from '../resources/index.js';
import webhook from '../utilities/Webhook.js'; // eslint-disable-line import/no-named-as-default

// eslint-disable-next-line valid-jsdoc
/**
 * Broadcast updates out to subscribing channels
 * @param {module:"discord.js".Client} client         bot client
 * @param {Database} settings settings object for fetching data
 *    information about current channel, guild, and bot settings
 */
export default class Broadcaster {
  constructor({ client = undefined, settings = undefined, workerCache = undefined }) {
    this.client = client;
    this.settings = settings;
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
    logger.silly(`broadcasting ${type} on ${platform}`);
    delete embed.bot;

    const guilds = this.workerCache.getKey('guilds');
    const channels = cachedEvents.includes(type)
      ? this.workerCache.getKey(`${type}:${platform}`)
      : await this.settings.getAgnosticNotifications(type, platform, items);
    if (!channels.length) {
      logger.silly(`No channels on ${platform} tracking ${type}... continuing`, 'WS');
      return;
    }

    await Promise.all(
      channels.map(async (channelId) => {
        if (typeof channelId === 'undefined' || !channelId.length) return;
        const ctx = await this.settings.getCommandContext(channelId);

        // localeCompare should return 0 if equal, so non-zero's will be truthy
        if (embed.locale && ctx.language.localeCompare(embed.locale)) {
          return;
        }

        const glist = Object.entries(guilds).filter(([, g]) => g.channels && g.channels.includes(channelId))[0];
        const guild = glist && glist.length ? glist[1] : undefined;

        if (!guild) {
          logger.info(`couldn't find guild for ${type} on ${channelId}`);
          return;
        }

        try {
          const content = this.workerCache.getKey('pings')[`${guild.id}:${[type].concat(items || [])}`] || '';
          await webhook(ctx, { content, embeds: [embed] });
        } catch (e) {
          if (e.message) {
            if (e.message.includes('Unknown Webhook')) {
              logger.warn(`Wiping webhook context for ${channelId}`);
              await this.settings.deleteWebhooksForChannel(channelId);
            }
            if (e.name === 'AbortError') {
              // ignore
            }
          } else {
            logger.error(e);
          }
        }
      })
    );
  }
}
