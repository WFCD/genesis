// @ts-nocheck -- incremental TS migration; worker notification runtime
import logger from '#shared/utilities/Logger';
import { cachedEvents } from '#shared/resources';
import webhook from '#shared/utilities/Webhook';
import { isCycleNotificationType, resolveNotificationExpiry } from '#shared/utilities/NotificationExpiry';
import { classifyDeliveryError, ISSUE_CODE } from '#shared/utilities/NotificationDeliveryErrors';

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

  /**
   * Broadcast embed to all channels for a platform and type
   * @param  {Discord.MessageEmbed} embed      Embed to send to a channel
   * @param  {string} platform   Platform of worldstate
   * @param  {string} type       Type of new data to notify
   * @param {string} locale locale string
   * @param  {Array}  [items=[]] Items to broadcast
   * @returns {boolean} true when at least one channel received the webhook (or none were subscribed)
   */
  async broadcast(embed, { platform, type, items = [], locale }) {
    logger.silly(`broadcasting ${type} on ${platform}`);
    delete embed.bot;

    const guilds = this.workerCache.getKey('guilds');
    const channels = await this.#resolveChannels({ type, platform, locale, items });
    if (!channels?.length) {
      logger.debug(`No channels on ${platform}:${locale} tracking ${type}... continuing`, 'WS');
      return !isCycleNotificationType(type);
    }

    let anySent = false;
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
          await this.#onUnknownGuild({
            channelId,
            message: `couldn't find guild for ${type} on ${channelId}`,
          });
          return;
        }

        if (await this.settings.notificationIssues.isGuildPaused(guild.id)) {
          logger.debug(`skipping paused guild ${guild.id} for ${type}`, 'WS');
          return;
        }

        try {
          const pingKey = `${guild.id}:${[type].concat((items || []).sort()).join(',')}`;
          const pings = this.workerCache.getKey('pings') || {};
          let content: string = pings[pingKey] || '';
          if (!content && type.startsWith('fissures.sp.node.')) {
            content = pings[`${guild.id}:fissures.sp.node`] || '';
          } else if (!content && type.startsWith('fissures.node.')) {
            content = pings[`${guild.id}:fissures.node`] || '';
          }
          const sent = await webhook.call({ settings: this.settings, client: this.client, scope: 'worker' }, ctx, {
            content,
            embeds: [embed],
          });
          if (!sent) {
            logger.warn(`webhook send failed for ${type} on channel ${channelId} (${platform}:${locale})`, 'WS');
            return;
          }
          anySent = true;
          if (sent && ctx.deleteExpired && ctx.webhook?.id && ctx.webhook.token) {
            const expiresAt = resolveNotificationExpiry(embed);
            if (expiresAt && !isCycleNotificationType(type)) {
              const eventId = items?.length ? [type, ...items].sort().join(',') : type;
              await this.settings.notificationMessages.enqueue({
                channelId,
                threadId,
                messageId: sent.id,
                webhookId: ctx.webhook.id,
                webhookToken: ctx.webhook.token,
                trackableType: type,
                eventId,
                expiresAt,
              });
            }
          }
        } catch (e) {
          if (e.name === 'AbortError') {
            return;
          }
          await this.#onDeliveryError({
            error: e,
            guildId: guild.id,
            channelId,
            threadId,
            type,
            platform,
            locale,
          });
        }
      })
    );
    return anySent;
  }

  async #onUnknownGuild({ channelId, message }) {
    const guildId = await this.settings.notificationIssues.getGuildIdForChannel(channelId);
    if (!guildId) {
      logger.warn(`unknown guild for channel ${channelId} with no channels.guild_id row`, 'WS');
      return;
    }
    if (await this.settings.notificationIssues.isGuildPaused(guildId)) {
      return;
    }
    const result = await this.settings.notificationIssues.handleUnknownGuild({
      guildId,
      channelId,
      message,
      wipeWebhook: (id) => this.settings.channels.deleteWebhooksForChannel(id),
    });
    logger.warn(`unknown guild ${guildId} channel ${channelId}: ${result}`, 'WS');
  }

  async #onDeliveryError({ error, guildId, channelId, threadId, type, platform, locale }) {
    const kind = classifyDeliveryError(error);
    const errMessage = error?.message || String(error);

    if (kind === 'unknown_webhook') {
      logger.warn(`Wiping webhook context for ${channelId}`);
      await this.settings.channels.deleteWebhooksForChannel(channelId);
      await this.settings.notificationIssues.upsertIssue({
        guildId,
        channelId,
        threadId: threadId ?? 0,
        code: ISSUE_CODE.unknownWebhook,
        message: errMessage,
      });
      return;
    }

    if (kind === 'unknown_guild') {
      await this.#onUnknownGuild({ channelId, message: errMessage });
      return;
    }

    if (kind === 'thread_locked') {
      const tid = threadId ?? 0;
      await this.settings.notificationIssues.upsertIssue({
        guildId,
        channelId,
        threadId: tid,
        code: ISSUE_CODE.threadLocked,
        message: errMessage,
      });
      if (tid && String(tid) !== '0') {
        await this.settings.tracking.removeThreadNotifications(channelId, tid);
        logger.warn(`Removed thread subscriptions for locked thread ${tid} on ${channelId}`, 'WS');
      }
      return;
    }

    logger.error(
      `webhook send failed for ${type} on channel ${channelId} (${platform}:${locale}) :: ${errMessage}`
    );
  }

  /** Cached trackables can be stale/empty after deploy — fall back to live DB lookup. */
  async #resolveChannels({ type, platform, locale, items }) {
    if (!cachedEvents.includes(type)) {
      return this.settings.getAgnosticNotifications({ type, platform, items, locale });
    }

    const cacheKey = `${type}:${platform}:${locale}`;
    const cached = this.workerCache.getKey(cacheKey);
    if (cached?.length) return cached;

    const fresh = await this.settings.getAgnosticNotifications({ type, platform, items, locale });
    if (fresh?.length) {
      this.workerCache.setKey(cacheKey, fresh);
      this.workerCache.save(true);
    }
    return fresh ?? [];
  }
}
