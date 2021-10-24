'use strict';

const BaseEmbed = require('./BaseEmbed.js');
const { assetBase } = require('../CommonFunctions');

const darvo = `${assetBase}/img/darvo-md.png`;

class DarvoEmbed extends BaseEmbed {
  constructor(bot, deal, platform) {
    super();
    if (Array.isArray(deal)) [deal] = deal;
    this.color = 0x0000ff;
    this.title = `[${platform.toUpperCase()}] Darvo Deal`;
    this.thumbnail = {
      url: darvo,
    };
    this.fields = [
      {
        name: `${deal.item}, ${deal.salePrice}p`,
        value: `Original price: ${deal.originalPrice}p, expires in ${deal.eta}`,
      },
    ];
    this.footer.text = `${deal.total - deal.sold}/${deal.total} left`;
  }
}

module.exports = DarvoEmbed;
