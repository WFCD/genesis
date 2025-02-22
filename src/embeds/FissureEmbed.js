import { wikiBase, cdn } from '../utilities/CommonFunctions.js';
import { rTime } from '../utilities/Wrappers.js';

import BaseEmbed from './BaseEmbed.js';

const fissureThumb = cdn('img/fissure-sm.png');
const steelPath = cdn('img/steelpath-h.png');

/**
 * Generates fissure embeds
 */
export default class FissureEmbed extends BaseEmbed {
  /**
   * @param {Array.<Fissure>|Fissure} fissures - The fissures to be included in the embed
   * @param {string} platform - platform
   * @param {I18n} i18n internationalization function
   * @param {string} era Era to override title
   * @param {string} locale Locality
   */
  constructor(fissures, { platform, i18n, era, locale }) {
    super(locale);
    if (!Array.isArray(fissures)) fissures = [fissures];

    if (fissures.length > 1) {
      this.data.title = i18n`[${platform.toUpperCase()}] Worldstate - Void Fissures`;
    }
    if (era) {
      this.data.title = i18n`[${platform.toUpperCase()}] ${era} Fissures`;
    }
    this.data.url = `${wikiBase}Void_Fissure`;
    this.data.thumbnail = {
      url: fissureThumb,
    };
    if (fissures.length > 1) {
      this.data.description = '_ _';
      fissures.sort((a, b) => a.tierNum - b.tierNum);

      this.data.fields = fissures.map((f) => ({
        name: i18n`${f.missionType} ${era ? '' : f.tier}`,
        value: `${i18n`${f.node} against ${f.enemy}`}${i18n`\n**Expires ${rTime(f.expiry)}**`}`,
      }));
    } else if (fissures.length === 0) {
      this.data.description = i18n`Currently no fissures`;
    } else {
      const f = fissures[0];
      this.data.title = i18n`[${platform.toUpperCase()}] ${f.missionType} ${f.tier}`;
      this.data.description = `${i18n`${f.node} against ${f.enemy}`}${i18n`\n**Expires ${rTime(f.expiry)}**`}`;
      if (f.isStorm) this.data.description += `\n${i18n`Void Storm - Archwing Required`}`;
      this.data.footer.text = i18n`Expires `;
      this.data.timestamp = new Date(f.expiry).getTime();
      this.data.thumbnail.url = fissureThumb;
      if (f.isHard) {
        this.setImage(steelPath);
      }
    }

    this.data.color = 0x4aa1b2;
  }
}
