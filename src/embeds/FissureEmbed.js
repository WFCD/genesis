'use strict';

const BaseEmbed = require('./BaseEmbed.js');
const { assetBase, wikiBase } = require('../CommonFunctions');

const fissureThumb = `${assetBase}${assetBase.endsWith('/') ? '' : '/'}img/fissure-sm.png`;

/**
 * Generates fissure embeds
 */
class FissureEmbed extends BaseEmbed {
  /**
   * @param {Genesis} bot - An instance of Genesis
   * @param {Array.<Fissure>} fissures - The fissures to be included in the embed
   * @param {string} platform - platform
   * @param {I18n} i18n internationalization function
   * @param {string} era Era to override title
   */
  constructor(bot, fissures, platform, i18n, era) {
    super(bot);

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
      this.description = '_ _'
      fissures.sort((a, b) => a.tierNum - b.tierNum);

      this.fields = fissures.map(f => ({
        name: i18n`${f.missionType} ${era ? '' : f.tier}`,
        value: i18n`[${f.eta}] ${f.node} against ${f.enemy}`,
      }));
    } else if (fissures.length === 0) {
      this.description = i18n`Currently no fissures`;
    } else {
      const f = fissures[0];
      this.title = i18n`[${platform.toUpperCase()}] ${f.missionType} ${f.tier}`;
      this.description = i18n`${f.node} against ${f.enemy}`;
      this.footer.text = i18n`${f.eta} remaining • Expires `;
      this.timestamp = new Date(f.expiry);
      this.thumbnail.url = fissureThumb;
    }

    this.color = 0x4aa1b2;
  }
}

module.exports = FissureEmbed;
