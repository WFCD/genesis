'use strict';

const RssFeedEmitter = require('rss-feed-emitter');

const Broadcaster = require('./Broadcaster');
const RSSEmbed = require('../embeds/RSSEmbed');
const { platforms } = require('../CommonFunctions');
const feeds = require('../resources/rssFeeds');

class FeedsNotifier {
  constructor({
    logger, shardId, client, settings, messageManager,
  }) {
    this.logger = logger;
    this.shardId = shardId;
    this.settings = settings;
    this.feeder = new RssFeedEmitter({ userAgent: `${client.user.username} Shard ${shardId}` });

    feeds.forEach((feed) => {
      this.feeder.add({ url: feed.url, timeout: 60000 });
    });

    this.start = Date.now();

    this.broadcaster = new Broadcaster({
      client,
      settings,
      messageManager,
      logger,
    });
    this.logger.debug(`Shard ${shardId} RSS Notifier ready`);

    this.feeder.on('new-item', (item) => {
      if (new Date(item.pubDate).getTime() > this.start) {
        const { key } = feeds.reduce(feed => feed.url === item.meta.link)[0];
        const itemEmbed = new RSSEmbed(item);
        platforms.forEach((platform) => {
          this.broadcaster.broadcast(itemEmbed, platform, key);
        });
      }
    });
  }
}

module.exports = FeedsNotifier;
