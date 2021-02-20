'use strict';

require('colors');
const RssFeedEmitter = require('rss-feed-emitter');

const Broadcaster = require('./Broadcaster');
const RSSEmbed = require('../embeds/RSSEmbed');
const feeds = require('../resources/rssFeeds');
const logger = require('../Logger');

const activePlatforms = (process.env.PLATFORMS || 'pc').split(',');

class FeedsNotifier {
  constructor({
    client, settings, messageManager, workerCache,
  }) {
    this.feeder = new RssFeedEmitter({
      userAgent: `RSS Feed Emitter | ${client.user.username}`,
      skipFirstLoad: true,
    });

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

    logger.info('Ready', 'RSS');
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
      logger.info(`new item: ${item.title}`, 'RSS');

      if (new Date(item.pubDate).getTime() > this.start) {
        const feed = feeds.filter(feedEntry => feedEntry.url === item.meta.link)[0];
        const itemEmbed = new RSSEmbed(item, feed);
        activePlatforms.forEach((platform) => {
          this.broadcaster.broadcast(itemEmbed, platform, feed.key);
        });
      }
    } catch (error) {
      logger.error(error);
    }
  }
}

module.exports = FeedsNotifier;
