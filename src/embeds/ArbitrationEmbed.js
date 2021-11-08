'use strict';

const { assetBase } = require('../CommonFunctions');

const arbiThumb = `${assetBase}/img/arbitrations.png`;

module.exports = class ArbitrationEmbed extends require('./BaseEmbed.js') {
  constructor(bot, arbitration, platform, i18n) {
    super();
    this.thumbnail.url = arbiThumb;
    this.color = 0x742725;
    this.title = i18n`[${platform.toUpperCase()}] Worldstate - Arbitration`;
    this.addField(arbitration.node || '???', arbitration.type || '???');

    this.footer.text = i18n`Expires`;
    this.timestamp = arbitration.expiry;
  }
};
