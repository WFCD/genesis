import { assetBase } from '#shared/utilities/CommonFunctions';

import BaseEmbed from './BaseEmbed';
import type { EmbedBuildOptions } from './embedOptions';

const simarisThumb = `${assetBase}/img/simaris.png`;

export default class SimarisEmbed extends BaseEmbed {
  constructor(simaris, { platform, i18n, locale }: EmbedBuildOptions) {
    super(locale);

    this.thumbnail = {
      url: simarisThumb,
    };
    this.title = i18n`[${platform.toUpperCase()}] Worldstate - Sanctuary`;
    this.color = simaris.isTargetActive > 2 ? 0x00ff00 : 0xff0000;
    this.description = simaris.asString;
  }
}
