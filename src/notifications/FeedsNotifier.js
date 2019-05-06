'use strict';

const Broadcaster = require('./Broadcaster');
const RSSEmbed = require('../embeds/RSSEmbed');
const { platforms } = require('../CommonFunctions');

class FeedsNotifier {
  constructor(bot) {
    this.logger = bot.logger;
    this.shardId = bot.shardId;

    this.broadcaster = new Broadcaster({
      client: bot.client,
      settings: bot.settings,
      messageManager: bot.messageManager,
      logger: bot.logger,
    });
    this.logger.debug(`Shard ${this.shardId} RSS Notifier ready`);

    bot.socket.on('rss', (rssItem) => {
      this.logger.debug(`received a ${rssItem.key}`);
      // make embed
      const embed = new RSSEmbed(rssItem);
      // broadcast
      platforms.forEach((platform) => {
        this.broadcaster.broadcast(embed, platform, rssItem.key);
      });
    });
  }
}

module.exports = FeedsNotifier;
