import BaseEmbed from './BaseEmbed.js';

import { apiCdnBase, emojify, wikiBase } from '../utilities/CommonFunctions.js';

const rarity = {
  common: 0x775448,
  uncommon: 0x5b5b64,
  rare: 0xb19452,
  legendary: 0xd8dad9,
  riven: 0xa892c6,
  peculiar: 0x626360,
};

export default class ModEmbed extends BaseEmbed {
  constructor(modData, { i18n, locale }) {
    super(locale);

    this.title = modData.name;
    this.color = rarity[modData.rarity.toLowerCase()];

    // If we have a description, show it. For stance mods, etc
    if (modData.description) {
      this.description = `_${emojify(modData.description)}_`;
    }

    // If we have an effect, show the max rank effect
    const statsLength = modData.levelStats && modData.levelStats.length;
    if (statsLength > 0) {
      const stats = modData.levelStats[statsLength - 1].stats.join('\n');
      this.description = `_${emojify(stats)}_`;
    }

    this.url = `${wikiBase}${modData.name.replace(/\s/gi, '_')}`;
    this.image = {
      url: `${apiCdnBase}img/${modData.imageName}`,
    };
    this.fields = [
      {
        name: i18n`Polarity`,
        value: emojify(modData.polarity.toLowerCase()),
        inline: true,
      },
      {
        name: i18n`Max Rank`,
        value: String(modData.fusionLimit),
        inline: true,
      },
      {
        name: i18n`Type`,
        value: String(modData.type),
        inline: true,
      },
      {
        name: i18n`Rarity`,
        value: modData.rarity,
        inline: true,
      },
      {
        name: i18n`Base Drain`,
        value: String(Math.abs(modData.baseDrain)),
        inline: true,
      },
      {
        name: i18n`Tradable`,
        value: emojify(modData.tradable ? 'green_tick' : 'red_tick'),
        inline: true,
      },
    ];
  }
}
