'use strict';

const BaseEmbed = require('./BaseEmbed.js');
const { assetBase } = require('../CommonFunctions');

const simarisThumb = `${assetBase}/img/simaris.png`;

module.exports = class SimarisEmbed extends BaseEmbed {
  constructor(simaris, { platform, i18n, locale }) {
    super(locale);

    this.thumbnail = {
      url: simarisThumb,
    };
    this.title = i18n`[${platform.toUpperCase()}] Worldstate - Sanctuary`;
    this.color = simaris.isTargetActive > 2 ? 0x00ff00 : 0xff0000;
    this.description = simaris.asString;
  }
};
