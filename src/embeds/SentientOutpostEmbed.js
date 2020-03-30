'use strict';

const BaseEmbed = require('./BaseEmbed.js');

const current = (outpost) => {
  const defStart = new Date(outpost.activation).getTime();
  const defEnd = new Date(outpost.expiry).getTime();
  const predStart = new Date(outpost.previous.activation).getTime();
  const predEnd = new Date(outpost.previous.expiry).getTime();
  if (defStart < predStart) {
    return {
      activation: new Date(defStart),
      expiry: new Date(defEnd),
    };
  }
  return {
    activation: new Date(predStart),
    expiry: new Date(predEnd),
  };
};

class SentientOutpostEmbed extends BaseEmbed {
  constructor(bot, outpost, platform, i18n) {
    super();
    this.setTitle(i18n`[${platform.toUpperCase()}] Sentient Outpost`);
    this.setDescription(outpost.mission.node);
    this.setFooter('Fades at');
    this.setTimestamp(current(outpost).expiry);
  }
}

module.exports = SentientOutpostEmbed;
