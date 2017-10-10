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
   * @param {string} platform - platform
   */
  constructor(bot, news, type, platform) {
    super();

    news.sort((a, b) => {
      const date1 = new Date(a.endDate || a.date);
      const date2 = new Date(b.endDate || b.date);

      return date2.getTime() - date1.getTime();
    });

    this.color = news.length > 0 ? 0x779ecb : 0xff6961;
    let value = news.map(n => n.asString).join('\n');
    if (type) {
      if (type === 'update') {
        value = value.length > 0 ? value : 'No Update News Currently';
      } else {
        value = value.length > 0 ? value : 'No Prime Access Currently';
      }
    } else {
      value = value.length > 0 ? value : 'No News Currently';
    }
    this.fields = [{ name: '_ _', value }];
    this.image = { url: news[0] ? news[0].imageLink : '' };
    this.footer.text += ` | ${platform.toUpperCase()}`;
  }
}

module.exports = NewsEmbed;
