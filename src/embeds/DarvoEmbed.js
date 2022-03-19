'use strict';

const BaseEmbed = require('./BaseEmbed.js');
const { assetBase } = require('../CommonFunctions');

const darvo = `${assetBase}/img/darvo-md.png`;

module.exports = class DarvoEmbed extends BaseEmbed {
  constructor(deal, { platform, i18n }) {
    super();
    if (Array.isArray(deal)) [deal] = deal;
    this.color = 0x0000ff;
    this.title = i18n`[${platform.toUpperCase()}] Darvo Deal`;
    this.thumbnail = {
      url: darvo,
    };
    this.fields = [
      {
        name: i18n`${deal.item}, ${deal.salePrice}p`,
        value: `Original price: ${deal.originalPrice}p, expires in ${deal.eta}`,
      },
    ];
    this.footer.text = i18n`${deal.total - deal.sold}/${deal.total} left`;
  }
};
