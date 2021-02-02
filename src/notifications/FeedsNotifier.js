'use strict';

const RssFeedEmitter = require('rss-feed-emitter');

const Broadcaster = require('./Broadcaster');
const RSSEmbed = require('../embeds/RSSEmbed');
const { platforms } = require('../CommonFunctions');
const feeds = require('../resources/rssFeeds');
const logger = require('../Logger');

class FeedsNotifier {
  constructor({
    client, settings, messageManager, workerCache,
  }) {
    this.feeder = new RssFeedEmitter({ userAgent: `RSS Feed Emitter | ${client.user.username}` });

    feeds.forEach((feed) => {
      this.feeder.add({ url: feed.url, refresh: 900000 });
    });

    this.broadcaster = new Broadcaster({
      client,
      settings,
      messageManager,
      workerCache,
    });
    this.feeder.on('error', logger.debug);
  }

  /**
   * Start up and set up event handlers for events
   */
  start() {
    this.start = Date.now();

    this.feeder.on('new-item', this.handleNewItem.bind(this));

    logger.info('[RSS] Ready');
  }

  /**
   * Handle a new feed item
   * @param  {Object} item RSS Feed Item
   */
  handleNewItem(item) {
    try {
      if (Object.keys(item.image).length) {
        logger.debug(`IMAGE: ${JSON.stringify(item.image)}`);
      }

      if (new Date(item.pubDate).getTime() > this.start) {
        const feed = feeds.filter(feedEntry => feedEntry.url === item.meta.link)[0];
        const itemEmbed = new RSSEmbed(item, feed);
        platforms.forEach((platform) => {
          this.broadcaster.broadcast(itemEmbed, platform, feed.key);
        });
      }
    } catch (error) {
      logger.error(error);
    }
  }
}

module.exports = FeedsNotifier;
