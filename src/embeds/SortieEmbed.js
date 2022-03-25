import BaseEmbed from './BaseEmbed.js';

import { assetBase } from '../utilities/CommonFunctions.js';

const sortieThumb = `${assetBase}/img/sortie.png`;

export default class SortieEmbed extends BaseEmbed {
  constructor(sortie, { platform, i18n, locale }) {
    super(locale);

    this.color = 0xa84300;
    if (typeof sortie !== 'undefined' && sortie) {
      this.fields = sortie.variants.map(v => ({
        name: `${v.node} - ${v.missionType}`,
        value: v.modifier,
      }));
      this.description = i18n`Currently in-progress sortie: **${sortie.boss}**`;
      this.footer.text = i18n`${sortie.eta} remaining`;
    }

    this.title = i18n`[${platform.toUpperCase()}] Worldstate - Sortie`;
    this.thumbnail = {
      url: sortieThumb,
    };
  }
}
