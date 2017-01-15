'use strict';

const BaseEmbed = require('./BaseEmbed.js');

/**
 * Generates update embeds
 */
class UpdateEmbed extends BaseEmbed {
  /**
   * @param {Genesis} bot - An instance of Genesis
   * @param {Array.<News>} news - The updates to be included in the embed
   */
  constructor(bot, news) {
    super(bot);

    news.sort((a, b) => {
      const date1 = a.endDate ? a.endDate : a.date;
      const date2 = b.endDate ? b.endDate : b.date;

      return date2.getTime() - date1.getTime();
    });

    this.color = news.length > 0 ? 0x00ff00 : 0xff0000;
    const value = news.map(n => n.toString()).join('\n');
    this.fields = [{
      name: 'Current updates:',
      value: value.length > 0 ? value : 'No Update News Currently',
    }];
    this.title = 'Worldstate - Updates';
  }
}

module.exports = UpdateEmbed;
