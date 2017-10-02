'use strict';

const BaseEmbed = require('./BaseEmbed.js');

/**
 * Generates daily deal embeds
 */
class DarvoEmbed extends BaseEmbed {
  /**
   * @param {Genesis} bot - An instance of Genesis
   * @param {DailyDeal} deal - The deal to be included in the embed
   * @param {string} platform - platform
   */
  constructor(bot, deal, platform) {
    super();

    this.color = 0x0000ff;
    this.title = `[${platform.toUpperCase()}] Darvo Deal`;
    this.url = 'https://ws.warframestat.us/';
    this.thumbnail = {
      url: 'http://i.imgur.com/UotylUm.png',
    };
    this.fields = [
      {
        name: `${deal.item}, ${deal.salePrice}p - ${deal.total - deal.sold}/${deal.total} left`,
        value: `Original price: ${deal.originalPrice}p, expires in ${deal.eta}`,
      },
    ];
  }
}

module.exports = DarvoEmbed;
