import { wikiBase, cdn } from '#shared/utilities/CommonFunctions';
import { fissureNodeTypeKey, fissureTypeKey } from '#shared/utilities/FissureTracking';
import { rTime } from '#shared/utilities/Wrappers';

import BaseEmbed from './BaseEmbed';
import type { EmbedBuildOptions } from './embedOptions';

const fissureThumb = cdn('img/fissure-sm.png');
const spLogo = cdn('img/sp-logo.png');

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
  constructor(fissures, { platform, i18n, era, locale }: EmbedBuildOptions) {
    super(locale);
    if (!Array.isArray(fissures)) fissures = [fissures];

    if (fissures.length > 1) {
      this.title = i18n`[${platform.toUpperCase()}] Worldstate - Void Fissures`;
    }
    if (era) {
      this.title = i18n`[${platform.toUpperCase()}] ${era} Fissures`;
    }
    this.url = `${wikiBase}Void_Fissure`;
    this.thumbnail = {
      url: fissureThumb,
    };
    if (fissures.length > 1) {
      this.description = '_ _';
      fissures.sort((a, b) => a.tierNum - b.tierNum);

      this.fields = fissures.map((f) => ({
        name: String(i18n`${f.missionType} ${era ? '' : f.tier}`),
        value: String(`${i18n`${f.node} against ${f.enemy}`}${i18n`\n**Expires ${rTime(f.expiry)}**`}`),
      }));
    } else if (fissures.length === 0) {
      this.description = i18n`Currently no fissures`;
    } else {
      const f = fissures[0];
      this.title = i18n`[${platform.toUpperCase()}] ${f.missionType} ${f.tier}`;
      this.description = `${i18n`${f.node} against ${f.enemy}`}${i18n`\n**Expires ${rTime(f.expiry)}**`}`;
      if (f.isStorm) this.description += `\n${i18n`Void Storm - Archwing Required`}`;
      const typeTrack = fissureTypeKey(f);
      const nodeTrack = fissureNodeTypeKey(f);
      const trackLines = [`${i18n`Type`}: \`${typeTrack}\``];
      if (nodeTrack) trackLines.push(`${i18n`Node`}: \`${nodeTrack}\``);
      this.fields = [
        {
          name: i18n`Track`,
          value: trackLines.join('\n'),
          inline: false,
        },
      ];
      this.footer.text = i18n`Expires `;
      this.timestamp = new Date(f.expiry).getTime();
      this.thumbnail.url = fissureThumb;
      if (f.isHard) {
        this.author = { name: i18n`Steel Path`, iconURL: spLogo };
      }
    }

    this.color = 0x4aa1b2;
  }
}
