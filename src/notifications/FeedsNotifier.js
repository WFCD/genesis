'use strict';

const RssFeedEmitter = require('rss-feed-emitter');

const Broadcaster = require('./Broadcaster');
const RSSEmbed = require('../embeds/RSSEmbed');
const { platforms } = require('../CommonFunctions');
const feeds = require('../resources/rssFeeds');

class FeedsNotifier {
  constructor({
    logger, client, settings, messageManager,
  }) {
    this.logger = logger;
    this.feeder = new RssFeedEmitter({ userAgent: `${client.user.username} Shard` });

    feeds.forEach((feed) => {
      this.feeder.add({ url: feed.url, timeout: 600000 });
    });

    this.start = Date.now();

    this.broadcaster = new Broadcaster({
      client,
      settings,
      messageManager,
      logger,
    });
    this.logger.debug('Shard RSS Notifier ready.');

    this.feeder.on('error', this.logger.debug);

    this.feeder.on('new-item', (item) => {
      try {
        if (Object.keys(item.image).length) {
          this.logger.debug(JSON.stringify(item.image));
        }

        if (new Date(item.pubDate).getTime() > this.start) {
          const feed = feeds.filter(feedEntry => feedEntry.url === item.meta.link)[0];
          const itemEmbed = new RSSEmbed(item, feed);
          platforms.forEach((platform) => {
            this.broadcaster.broadcast(itemEmbed, platform, feed.key);
          });
        }
      } catch (error) {
        this.logger.error(error);
      }
    });
  }
}

module.exports = FeedsNotifier;
