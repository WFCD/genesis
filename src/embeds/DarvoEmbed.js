'use strict';

const BaseEmbed = require('./BaseEmbed.js');

/**
 * Generates daily deal embeds
 */
class DarvoEmbed extends BaseEmbed {
  /**
   * @param {Genesis} bot - An instance of Genesis
   * @param {DailyDeal} deal - The deal to be included in the embed
   */
  constructor(bot, deal) {
    super(bot);

    this.color = 0x0000ff;
    this.title = 'Worldstate - Darvo';
    this.url = 'https://warframe.com';
    this.description = 'Today\'s Darvo deal';
    this.thumbnail = {
      url: 'https://raw.githubusercontent.com/aliasfalse/genesis/master/src/resources/darvo.png',
    };
    this.fields = [
      {
        name: `${deal.item}, ${deal.salePrice}p - ${deal.total - deal.sold}/${deal.total} left`,
        value: `Original price: ${deal.originalPrice}p, expires in ${deal.getEtaString()}`,
      },
    ];
  }
}

module.exports = DarvoEmbed;
