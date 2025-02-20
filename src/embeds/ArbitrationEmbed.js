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
    this.setThumbnail(arbiThumb);
    this.setColor(0x742725);
    this.setTitle(i18n`[${platform.toUpperCase()}] Worldstate - Arbitration`);
    this.addFields([
      {
        name: arbitration.node || '???',
        value: arbitration.type || '???',
      },
    ]);
    this.setFooter({ text: i18n`Expires` });
    this.setTimestamp(arbitration.expiry);
  }
}
