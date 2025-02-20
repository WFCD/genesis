import { assetBase } from '../utilities/CommonFunctions.js';

import BaseEmbed from './BaseEmbed.js';

const simarisThumb = `${assetBase}/img/simaris.png`;

export default class SimarisEmbed extends BaseEmbed {
  constructor(simaris, { platform, i18n, locale }) {
    super(locale);

    this.setThumbnail(simarisThumb);
    this.setTitle(i18n`[${platform.toUpperCase()}] Worldstate - Sanctuary`);
    this.setColor(simaris.isTargetActive > 2 ? 0x00ff00 : 0xff0000);
    this.setDescription(simaris.asString);
  }
}
