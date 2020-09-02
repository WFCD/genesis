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
   * @returns {Array.<Object>} values for successes
   */
  async broadcast(embed, platform, type, items = []) {
    const channels = await this.settings.getNotifications(type, platform, items);
    embed.bot = undefined; // eslint-disable-line no-param-reassign

    const guilds = await this.settings.getGuilds();

    return Promise.all(channels.map(async (result) => {
      // need some way to do this other than getting all channels....
      // let's try looping over a list of ids
      const ctx = await this.settings.getCommandContext(result.channelId);

      if (embed.locale && ctx.language.toLowerCase() !== embed.locale.toLowerCase()) {
        return false;
      }

      let guild;

      Object.entries(guilds).forEach(([, g]) => {
        if (g.channels.includes(result.channelId)) {
          guild = g;
        }
      });

      const prepend = await this.settings.getPing(guild, (items || []).concat([type]));

      if (!embed.embeds) {
        return this.messageManager.webhook(
          ctx,
          { text: prepend, embed: this.messageManager.webhookWrapEmbed(embed, ctx) },
        );
      }

      return this.messageManager.webhook(
        ctx,
        { text: prepend, embed },
      );
    }));
  }
}

module.exports = Broadcaster;
