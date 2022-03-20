'use strict';

const BaseEmbed = require('./BaseEmbed.js');

module.exports = class SentientOutpostEmbed extends BaseEmbed {
  constructor(outpost, { platform, i18n, locale }) {
    super(locale);
    this.setTitle(i18n`[${platform.toUpperCase()}] Sentient Outpost`);
    this.setDescription(outpost.mission.node);
    this.setFooter({ text: i18n`Fades at` });
    this.setTimestamp(outpost.expiry);
  }
};
