import BaseEmbed from './BaseEmbed.js';
import { assetBase } from '../utilities/CommonFunctions.js';

const arbiThumb = `${assetBase}/img/arbitrations.png`;

export default class ArbitrationEmbed extends BaseEmbed {
  constructor(arbitration, { platform, i18n, locale }) {
    super(locale);
    this.thumbnail.url = arbiThumb;
    this.color = 0x742725;
    this.title = i18n`[${platform.toUpperCase()}] Worldstate - Arbitration`;
    this.addField(arbitration.node || '???', arbitration.type || '???');

    this.footer.text = i18n`Expires`;
    this.timestamp = arbitration.expiry;
  }
}
