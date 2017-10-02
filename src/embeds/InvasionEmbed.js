'use strict';

const BaseEmbed = require('./BaseEmbed.js');

/**
 * Generates invasion embeds
 */
class InvasionEmbed extends BaseEmbed {
  /**
   * @param {Genesis} bot - An instance of Genesis
   * @param {Array.<Invasion>} invasions - The invasions to be included in the embed
   * @param {string} platform - platform
   */
  constructor(bot, invasions, platform) {
    super();

    this.color = 0x3498db;
    this.url = 'https://ws.warframestat.us/';
    if (invasions.length > 1) {
      this.fields = invasions.map((i) => {
        let rewards = i.defenderReward.asString;
        if (!i.vsInfestation) {
          rewards = `${i.attackerReward.asString} vs ${rewards}`;
        }
        const completion = Math.round(i.completion * 100) / 100;
        return {
          name: `${rewards} - ${completion > 0 ? completion : 0}%`,
          value: `${i.desc} on ${i.node} - ETA ${i.eta}`,
        };
      });
      this.title = `[${platform.toUpperCase()}] Worldstate - Invasions`;
      this.description = 'Currently in-progress invasions:';
    } else {
      const i = invasions[0];
      let rewards = i.defenderReward.asString;
      if (!i.vsInfestation) {
        rewards = `${i.attackerReward.asString} vs ${rewards}`;
      }
      const completion = Math.round(i.completion * 100) / 100;
      this.title = `[${platform.toUpperCase()}] ${rewards} - ${completion > 0 ? completion : 0}%`;
      this.description = i.desc;
      this.fields = [
        { name: 'Location', value: i.node, inline: true },
      ];
      this.footer.text = `${i.eta.replace(/-?Infinityd/ig, '\u221E')} remaining | ${new Date().toLocaleString()}`;
    }

    this.thumbnail = {
      url: 'http://i.imgur.com/QUPS0ql.png',
    };
  }
}

module.exports = InvasionEmbed;
