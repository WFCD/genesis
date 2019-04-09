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
    [this.description] = chunkify({
      string: feedItem.description.replace(/<(?:.|\n)*?>/gm, '').replace(/\n+\s*/gm, '\n'),
    });
    this.url = feedItem.link;
    this.timestamp = feedItem.pubdate;
    this.title = feedItem.title;


    this.color = 0x993333;
    this.footer.text = `${feedItem.meta.description} • Published`;
  }
}

module.exports = RSSEmbed;
