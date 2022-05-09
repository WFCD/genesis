import BaseEmbed from './BaseEmbed.js';
import { createGroupedArray } from '../utilities/CommonFunctions.js';

export default class DropsEmbed extends BaseEmbed {
  constructor(drops, { i18n, locale }) {
    super(locale);
    if (!drops || !drops.length) {
      this.description = i18n`No drops`;
      return;
    }
    const longest = (
      drops.length ? drops.map((result) => result.location).reduce((a, b) => (a.length > b.length ? a : b)) : ''
    ).length;

    const consolidated = drops
      .map((drop) => {
        if (!(drop.rarity && drop.location && drop.chance)) return undefined;

        const chance = `${drop.rarity.charAt(0).toUpperCase()}@${(drop.chance * 100).toFixed(2)}%`;
        return `\`${drop.location.padEnd(longest, '\u2003')} | ${chance}\``;
      })
      .filter((drop) => drop);

    const dropGroups = createGroupedArray(consolidated, 10);
    this.fields = dropGroups.map((group) => ({
      name: '\u200B',
      value: group.join('\n'),
      inline: false,
    }));
  }
}
