'use strict';

const BaseEmbed = require('./BaseEmbed.js');
const { assetBase } = require('../CommonFunctions');

const darvo = `${assetBase}/img/darvo-md.png`;

/**
 * Generates daily deal embeds
 */
module.exports = class SalesEmbed extends BaseEmbed {
  /**
   * @param {Array.<FeaturedItemSales>} sales - The sales to be displayed as featured or popular
   * @param {string} platform - platform
   * @param {I18n} i18n internationalizer
   */
  constructor(sales, { platform, i18n }) {
    super();

    this.color = 0x0000ff;
    this.title = sales[0].isPopular ? i18n`[${platform.toUpperCase()}] Popular Sales` : i18n`[${platform.toUpperCase()}] Featured Deal`;
    this.thumbnail = {
      url: darvo,
    };
    this.fields = [];
    sales.forEach((sale) => {
      this.fields.push({
        name: i18n`${sale.item}, ${sale.premiumOverride}p ${sale.discount > 0 ? `${sale.discount}% off` : ''}`,
        value: i18n`Expires in ${sale.eta}`,
      });
    });
  }
};
