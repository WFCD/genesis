import BaseEmbed from './BaseEmbed.js';

import { cdn } from '../utilities/CommonFunctions.js';

const sortieThumb = cdn(`img/sortie.png`);
const narmer = cdn('img/narmer.png');

export default class SortieEmbed extends BaseEmbed {
  constructor(sortie, { platform, i18n, locale }) {
    super(locale);

    this.color = 0xa84300;
    if (typeof sortie !== 'undefined' && sortie) {
      this.fields = sortie?.variants?.length
        ? sortie.variants.map((v) => ({
            name: `${v.node} - ${v.missionType}`,
            value: v.modifier,
          }))
        : sortie?.missions.map((m) => ({
            name: `${m.node} - ${m.type}`,
            value: '_ _',
          }));
      if (sortie?.variants?.length) {
        this.description = i18n`Currently in-progress sortie: **${sortie.boss}**`;
        this.title = i18n`[${platform.toUpperCase()}] Worldstate - Sortie`;
        this.thumbnail = {
          url: sortieThumb,
        };
      } else {
        this.description = i18n`Currently in-progress hunt: **${sortie.boss}**`;
        this.title = i18n`[${platform.toUpperCase()}] Worldstate - Archon Hunt`;
        this.thumbnail = {
          url: narmer,
        };
      }
      this.footer.text = i18n`${sortie.eta} remaining`;
    }
  }
}
