// @ts-nocheck -- incremental TS migration; worker notification runtime
import logger from '#shared/utilities/Logger';
import { cachedEvents } from '#shared/resources';
import webhook from '#shared/utilities/Webhook';

/**
 * Broadcast updates out to subscribing channels
 * @param {import('discord.js').Client} client         bot client
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
   * @param  {Discord.MessageEmbed} embed      Embed to send to a channel
   * @param  {string} platform   Platform of worldstate
   * @param  {string} type       Type of new data to notify
   * @param {string} locale locale string
   * @param  {Array}  [items=[]] Items to broadcast
   * @returns {Array.<Object>} values for successes
   */
  async broadcast(embed, { platform, type, items = [], locale }) {
    logger.silly(`broadcasting ${type} on ${platform}`);
    delete embed.bot;

    const guilds = this.workerCache.getKey('guilds');
    const channels = cachedEvents.includes(type)
      ? this.workerCache.getKey(`${type}:${platform}:${locale}`)
      : await this.settings.getAgnosticNotifications({ type, platform, items, locale });
    if (!channels?.length) {
      logger.debug(`No channels on ${platform}:${locale} tracking ${type}... continuing`, 'WS');
      return;
    }

    await Promise.all(
      channels.map(async ({ channelId, threadId }) => {
        if (typeof channelId === 'undefined' || !channelId.length) return;
        const ctx = await this.settings.getCommandContext(channelId);
        ctx.threadId = threadId;

        // localeCompare should return 0 if equal, so non-zero's will be truthy
        if (embed.locale && ctx.language.localeCompare(embed.locale)) {
          return;
        }

        const guildList = Object.entries(guilds).filter(([, g]) => g.channels && g.channels.includes(channelId))[0];
        const guild = guildList && guildList.length ? guildList[1] : undefined;

        if (!guild) {
          logger.info(`couldn't find guild for ${type} on ${channelId}`);
          return;
        }

        try {
          const pingKey = `${guild.id}:${[type].concat((items || []).sort()).join(',')}`;
          const pings = this.workerCache.getKey('pings') || {};
          /** @type {string} */
          let content = pings[pingKey] || '';
          if (!content && type.startsWith('fissures.sp.node.')) {
            content = pings[`${guild.id}:fissures.sp.node`] || '';
          } else if (!content && type.startsWith('fissures.node.')) {
            content = pings[`${guild.id}:fissures.node`] || '';
          }
          await webhook.call(
            { settings: this.settings, client: this.client, scope: 'worker' },
            ctx,
            { content, embeds: [embed] }
          );
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
