'use strict';

const BaseEmbed = require('./BaseEmbed.js');

const { chunkify } = require('../CommonFunctions');

/**
 * Generates daily deal embeds
 */
class RSSEmbed extends BaseEmbed {
  /**
   * @param {Logger} bot.logger - Logger instance for this bot
   * @param {Object} feedItem - feed item
   */
  constructor(feedItem) {
    super();
    [this.description] = chunkify({ string: feedItem.body || '\u200B' });
    this.url = feedItem.url;
    this.timestamp = feedItem.timestamp;
    this.title = feedItem.title;

    this.color = 0x993333;
    this.footer.text = `${feedItem.description} • Published`;

    this.thumbnail = { url: 'https://i.imgur.com/GGzVZPL.png', height: 50, width: 50 };
    this.author = feedItem.author;
    this.image = {
      url: feedItem.image,
    };
  }
}

module.exports = RSSEmbed;
