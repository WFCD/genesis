import logger from '../utilities/Logger.js';
import { chunkify, markdinate } from '../utilities/CommonFunctions.js';

import BaseEmbed from './BaseEmbed.js';

/**
 * Generates daily deal embeds
 */
class RSSEmbed extends BaseEmbed {
  /**
   * @param {Object} feedItem - feed item
   * @param {Object} feed - Configured Feed details providing the key and defaults
   */
  constructor(feedItem, feed) {
    super();
    // clean up description, falling back to an empty string
    let strippedDesc = markdinate((feedItem.description || '\u200B').replace(/<\\?string>/gi, ''));
    const firstLine = strippedDesc.split('\n')[0].replace(/\*\*/g, '');

    if (feedItem.title.includes(firstLine)) {
      const tokens = strippedDesc.split('\n');
      tokens.shift();
      strippedDesc = tokens.join('\n');
    }

    try {
      const chunks = chunkify({
        string: strippedDesc,
        maxLength: 1000,
        breakChar: '\n',
        checkTitle: true,
      });

      if (chunks) {
        [strippedDesc] = chunks;
        // strip the last title if it starts with a title
        if (strippedDesc.endsWith('**')) {
          strippedDesc = strippedDesc.replace(/\*\*(.*)\*\*$/g, '');
        }

        this.description = strippedDesc;
      }
    } catch (e) {
      logger.error(e);
      logger.debug(strippedDesc, 'WS');
    }

    this.setURL(feedItem.link);
    this.setTimestamp(feedItem.pubdate);
    this.setTitle(feedItem.title);

    this.setColor(0x993333);
    this.setFooter({ text: `${feedItem.meta.description} • Published` });

    this.setThumbnail('https://i.imgur.com/GGzVZPL.png');

    if (feed.author) {
      this.setAuthor({ name: feed.author });
    } else {
      this.setAuthor({
        name: 'Warframe Forums',
        url: feedItem['rss:link']['#'],
        icon_url: 'https://i.imgur.com/hE2jdpv.png',
      });
    }

    if (!Object.keys(feedItem.image).length) {
      let first = ((feedItem.description || '').match(/<img.*src="(.*)".*>/i) || [])[1];
      if (first) {
        if (first.startsWith('//')) {
          first = first.replace('//', 'https://');
          this.setImage(first);
        }
      } else if (feed.defaultAttach) {
        this.setImage(feed.defaultAttach);
      }
    }

    if (!this.data.description?.length) this.setDescription('_ _');
  }
}

export default RSSEmbed;
