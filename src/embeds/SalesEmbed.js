'use strict';

const BaseEmbed = require('./BaseEmbed.js');

/**
 * Generates daily deal embeds
 */
class SalesEmbed extends BaseEmbed {
  /**
   * @param {Genesis} bot - An instance of Genesis
   * @param {Array.<FeaturedItemSales>} sales - The sales to be displayed as featured or popular
   */
  constructor(bot, sales) {
    super();

    this.color = 0x0000ff;
    this.title = `Worldstate - ${sales[0].isPopular ? 'Popular Sales' : 'Featured Deal'}`;
    this.url = 'https://warframe.com';
    this.description = 'Today\'s Darvo deal';
    this.thumbnail = {
      url: 'https://raw.githubusercontent.com/aliasfalse/genesis/master/src/resources/darvo.png',
    };
    this.fields = [];
    sales.forEach((sale) => {
      this.fields.push({
        name: `${sale.item}, ${sale.premiumOverride}p ${sale.discount > 0 ? `${sale.discount}% off` : ''}`,
        value: `Expires in ${sale.getETAString()}`,
      });
    });
  }
}

module.exports = SalesEmbed;
