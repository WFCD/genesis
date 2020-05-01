'use strict';

const BaseEmbed = require('./BaseEmbed.js');

class SentientOutpostEmbed extends BaseEmbed {
  constructor(bot, outpost, platform, i18n) {
    super();
    this.setTitle(i18n`[${platform.toUpperCase()}] Sentient Outpost`);
    this.setDescription(outpost.mission.node);
    this.setFooter('Fades at');
    this.setTimestamp(outpost.expiry);
  }
}

module.exports = SentientOutpostEmbed;
