// @ts-nocheck -- incremental TS migration; worker notification runtime
import RssFeedEmitter from 'rss-feed-emitter';

import RSSEmbed from '#shared/embeds/RSSEmbed';
import { locales, rssFeeds } from '#shared/resources';
import logger from '#shared/utilities/Logger';

import Broadcaster from './Broadcaster';
import { notifyKey, rssClaimId } from './NotifierUtils';

const activePlatforms = (process.env.PLATFORMS || 'pc').split(',');

export default class FeedsNotifier {
  #feeder;
  #broadcaster;
  #settings;
  #start;

  constructor({ client, settings, workerCache }) {
    this.#settings = settings;
    this.#feeder = new RssFeedEmitter({
      userAgent: `RSS Feed Emitter | ${client.user.username}`,
      skipFirstLoad: true,
    });

    rssFeeds.forEach((feed) => {
      this.#feeder.add({ url: feed.url, refresh: 900000 });
    });

    this.#broadcaster = new Broadcaster({
      client,
      settings,
      workerCache,
    });
    this.#feeder.on('error', (error) => logger.debug(error, 'RSS'));
  }

  /**
   * Start up and set up event handlers for events
   */
  start() {
    this.#start = Date.now();

    this.#feeder.on('new-item', this.#handleNewItem.bind(this));

    logger.info('Ready', 'RSS');
  }

  /**
   * Handle a new feed item
   * @param  {Object} item RSS Feed Item
   */
  async #handleNewItem(item) {
    try {
      if (Object.keys(item.image).length) {
        logger.debug(`IMAGE: ${JSON.stringify(item.image)}`);
      }
      logger.info(`new item: ${item.title}`, 'RSS');

      if (new Date(item.pubDate).getTime() > this.#start) {
        const feed = rssFeeds.filter((feedEntry) => feedEntry.url === item.meta.link)[0];
        if (!feed) return;

        const claimId = rssClaimId(feed.key, item);
        if (!claimId) {
          logger.warn(`RSS item missing guid/link; skipping ${item.title}`, 'RSS');
          return;
        }

        const itemEmbed = new RSSEmbed(item, feed);
        await Promise.all(
          activePlatforms.flatMap((platform) =>
            locales.map(async (locale) => {
              const claimed = await this.#settings.claimNotifiedIds(notifyKey(platform, locale), [claimId]);
              if (!claimed.length) {
                logger.debug(`skipping duplicate RSS ${claimId}`, 'RSS');
                return;
              }
              const sent = await this.#broadcaster.broadcast(itemEmbed, { platform, type: feed.key, locale });
              if (!sent) {
                await this.#settings.releaseNotifiedIds(notifyKey(platform, locale), [claimId]);
              }
            })
          )
        );
      }
    } catch (error) {
      logger.error(error);
    }
  }
}
