import { assetBase } from '../utilities/CommonFunctions.js';

import BaseEmbed from './BaseEmbed.js';

const arbiThumb = `${assetBase}/img/arbitrations.png`;

export default class ArbitrationEmbed extends BaseEmbed {
  /**
   * Create an embed from an array, or single, arbitration
   * @param {WorldState.Arbitration} arbitration arbitration to be displayed
   * @param {string} platform platform of the worldstate
   * @param {I18n} i18n translator
   * @param {string} locale locale of the worldstate
   */
  constructor(arbitration, { platform, i18n, locale }) {
    super(locale);
    this.thumbnail.url = arbiThumb;
    this.color = 0x742725;
    this.title = i18n`[${platform.toUpperCase()}] Worldstate - Arbitration`;
    this.fields.push({
      name: arbitration.node || '???',
      value: arbitration.type || '???',
    });
    this.footer.text = i18n`Expires`;
    this.timestamp = arbitration.expiry;
  }
}
