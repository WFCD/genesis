'use strict';

const bs = require('byte-size');
const logger = require('../Logger');

function byteFmt() {
  return `${this.value}${this.unit}`;
}

const clean = (channelId, index) => {
  if (index % 1000) return;
  if (global.gc) {
    try {
      const v8 = require('v8');
      const before = v8.getHeapStatistics();
      global.gc();
      const after = v8.getHeapStatistics();

      const entry = {
        b: { u: bs(before.used_heap_size, byteFmt), l: bs(before.heap_size_limit, byteFmt) },
        a: { u: bs(after.used_heap_size, byteFmt), l: bs(after.heap_size_limit, byteFmt) },
      };

      logger.silly(`${channelId} ======> ${String(entry.b.u).padEnd(7)} || ${String(entry.a.u).padEnd(7)}`);
    } catch (e) {
      logger.info(e);
    }
  }
};

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
    this.shards = process.env.SHARDS;
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
    delete embed.bot;
    const guilds = await this.settings.getGuilds();

    const channels = await this.settings.getAgnosticNotifications(type, platform, items);
    for (const result of channels) {
      const index = channels.indexOf(result);
      const ctx = await this.settings.getCommandContext(result.channelId);

      // localeCompare should return 0 if equal, so non-zero's will be truthy
      if (embed.locale && ctx.language.localeCompare(embed.locale)) {
        clean(result.channelId, index);
        continue;
      }

      const glist = Object.entries(guilds)
        .filter(([, g]) => g.channels && g.channels.includes(result.channelId))[0];
      const guild = glist && glist.length ? glist[1] : null;

      if (!guild) continue;

      try {
        const prepend = await this.settings.getPing(guild, (items || []).concat([type]));
        if (!embed.embeds) {
          await this.webhook(ctx, { text: prepend, embed: this.wrap(embed, ctx) });
        } else {
          await this.webhook(ctx, { text: prepend, embed });
        }
        clean(result.channelId, index);
      } catch (e) {
        logger.error(e);
      }
    }
  }
}

module.exports = Broadcaster;
