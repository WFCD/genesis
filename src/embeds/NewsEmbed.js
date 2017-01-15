'use strict';

const BaseEmbed = require('./BaseEmbed.js');

/**
 * Generates news embeds
 */
class NewsEmbed extends BaseEmbed {
  /**
   * @param {Genesis} bot - An instance of Genesis
   * @param {Array.<News>} news - The news to be included in the embed
   */
  constructor(bot, news) {
    super(bot);

    news.sort((a, b) => {
      const date1 = a.endDate ? a.endDate : a.date;
      const date2 = b.endDate ? b.endDate : b.date;

      return date2.getTime() - date1.getTime();
    });

    this.color = news.length > 2 ? 0x00ff00 : 0xff0000;
    this.fields = [{ name: 'Current news:', value: news.join('\n') }];
    this.title = 'Worldstate - News';
  }
}

module.exports = NewsEmbed;
