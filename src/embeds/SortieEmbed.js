import { cdn } from '../utilities/CommonFunctions.js';

import BaseEmbed from './BaseEmbed.js';

const sortieThumb = cdn(`img/sortie.png`);
const narmer = cdn('img/narmer.png');

export default class SortieEmbed extends BaseEmbed {
  constructor(sortie, { platform, i18n, locale }) {
    super(locale);

    this.setColor(0xa84300);
    if (typeof sortie !== 'undefined' && sortie) {
      this.setFields(
        sortie?.variants?.length
          ? sortie.variants.map((v) => ({
              name: `${v.node} - ${v.missionType}`,
              value: v.modifier,
            }))
          : sortie?.missions.map((m) => ({
              name: `${m.node} - ${m.type}`,
              value: '_ _',
            }))
      );
      if (sortie?.variants?.length) {
        this.setDescription(i18n`Currently in-progress sortie: **${sortie.boss}**`);
        this.setTitle(i18n`[${platform.toUpperCase()}] Worldstate - Sortie`);
        this.setThumbnail(sortieThumb);
      } else {
        this.setDescription(i18n`Currently in-progress hunt: **${sortie.boss}**`);
        this.setTitle(i18n`[${platform.toUpperCase()}] Worldstate - Archon Hunt`);
        this.setThumbnail(narmer);
      }
      this.setFooter({ text: i18n`${sortie.eta} remaining` });
    }
  }
}
