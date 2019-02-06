'use strict';

const BaseEmbed = require('./BaseEmbed.js');
const { assetBase, wikiBase } = require('../CommonFunctions');

const invasionThumb = `${assetBase}img/invasion.png`;

/**
 * Generates invasion embeds
 */
class InvasionEmbed extends BaseEmbed {
  /**
   * @param {Genesis} bot - An instance of Genesis
   * @param {Array.<Invasion>} invasions - The invasions to be included in the embed
   * @param {string} platform - platform
   * @param {Object} i18n - internationalization template function
   */
  constructor(bot, invasions, platform, i18n) {
    super();

    this.color = 0x3498db;
    this.url = `${wikiBase}Invasion`;
    if (invasions.length > 1) {
      this.fields = invasions.map((i) => {
        let rewards = i.defenderReward.asString;
        if (!i.vsInfestation) {
          rewards = i18n`${i.attackerReward.asString} vs ${rewards}`;
        }
        const completion = Math.round(i.completion * 100) / 100;
        return {
          name: i18n`${rewards} - ${completion > 0 ? completion : 0}%`,
          value: i18n`${i.desc} on ${i.node} - ETA ${i.eta}`,
        };
      });
      this.title = i18n`[${platform.toUpperCase()}] Worldstate - Invasions`;
      this.description = i18n`Currently in-progress invasions:`;
    } else {
      const i = invasions[0];
      let rewards = i.defenderReward.asString;
      if (!i.vsInfestation) {
        rewards = i18n`${i.attackerReward.asString} vs ${rewards}`;
      }
      const completion = Math.round(i.completion * 100) / 100;
      this.title = i18n`[${platform.toUpperCase()}] ${rewards} - ${completion > 0 ? completion : 0}%`;
      this.description = i.desc;
      this.fields = [
        { name: i18n`Location`, value: i.node, inline: true },
      ];
      this.footer.text = i18n`${i.eta.replace(/-?Infinityd/ig, '\u221E')} remaining`;
    }

    this.thumbnail = {
      url: invasionThumb,
    };
  }
}

module.exports = InvasionEmbed;
