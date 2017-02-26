'use strict';

const BaseEmbed = require('./BaseEmbed.js');

/**
 * Generates news embeds
 */
class NewsEmbed extends BaseEmbed {
  /**
   * @param {Genesis} bot - An instance of Genesis
   * @param {Array.<News>} news - The news to be included in the embed
   * @param {string} type - [Optional] type of embed between news, updates,
   *                        or prime access. Not provided for news.
   */
  constructor(bot, news, type) {
    super();

    news.sort((a, b) => {
      const date1 = a.endDate ? a.endDate : a.date;
      const date2 = b.endDate ? b.endDate : b.date;

      return date2.getTime() - date1.getTime();
    });

    this.color = news.length > 0 ? 0x00ff00 : 0xff0000;
    let name = '';
    let value = news.map(n => n.toString()).join('\n');
    let title = '';
    if (type) {
      if (type === 'update') {
        name = 'Current updates:';
        value = value.length > 0 ? value : 'No Update News Currently';
        title = 'Worldstate - Updates';
      } else {
        name = 'Current prime access:';
        value = value.length > 0 ? value : 'No Prime Access Currently';
        title = 'Worldstate - Prime Access';
      }
    } else {
      name = 'Current news:';
      value = value.length > 0 ? value : 'No News Currently';
      title = 'Worldstate - News';
    }

    this.fields = [{ name, value }];
    this.title = title;
  }
}

module.exports = NewsEmbed;
