import { assetBase, wikiBase } from '../utilities/CommonFunctions.js';

import BaseEmbed from './BaseEmbed.js';

const invasionThumb = `${assetBase}img/invasion.png`;

/**
 * Generates invasion embeds
 */
export default class InvasionEmbed extends BaseEmbed {
  /**
   * @param {Array.<Invasion>|Invasion} invasions - The invasions to be included in the embed
   * @param {string} platform - platform
   * @param {Object} i18n - internationalization template function
   * @param {string} locale locale
   */
  constructor(invasions, { platform, i18n, locale }) {
    super(locale);
    if (!Array.isArray(invasions)) invasions = [invasions];

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
      this.fields = [{ name: i18n`Location`, value: i.node, inline: true }];
      this.footer.text = i18n`${i.eta.replace(/-?Infinityd/gi, '\u221E')} remaining`;
    }

    this.thumbnail = {
      url: invasionThumb,
    };
  }
}
