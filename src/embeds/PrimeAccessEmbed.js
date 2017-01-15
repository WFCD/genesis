'use strict';

const BaseEmbed = require('./BaseEmbed.js');

/**
 * Genereates Prime Access embeds
 */
class PrimeAccessEmbed extends BaseEmbed {
  /**
   * @param {Genesis} bot - An instance of Genesis
   * @param {Array.<News>} news - The Prime Access news to be included in the embed
   */
  constructor(bot, news) {
    super(bot);
    this.title = 'Worldstate - Prime Access';

    this.color = news.length > 0 ? 0x00ff00 : 0xff0000;
    const value = news.map(n => n.toString()).join('\n');
    this.fields = [{ name: 'Current prime access:', value: value.length > 0 ? value : 'No Prime Access Currently' }];
  }
}

module.exports = PrimeAccessEmbed;
