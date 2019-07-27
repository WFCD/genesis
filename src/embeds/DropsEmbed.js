'use strict';

const rpad = require('right-pad');
const BaseEmbed = require('./BaseEmbed.js');

const { createGroupedArray } = require('../CommonFunctions.js');

class DropsEmbed extends BaseEmbed {
  constructor(bot, drops) {
    super(bot);
    if (!drops || !drops.length) {
      this.description = 'No drops';
      return;
    }
    const longest = (drops.length ? drops.map(result => result.location)
      .reduce((a, b) => (a.length > b.length ? a : b)) : '').length;

    const consolidated = drops.map((drop) => {
      if (!(drop.rarity && drop.location && drop.chance)) return undefined;

      const chance = `${drop.rarity.charAt(0).toUpperCase()}@${(drop.chance * 100).toFixed(2)}%`;
      return `\`${rpad(drop.location, longest, '\u2003')} | ${chance}\``;
    }).filter(drop => drop);

    const dropGroups = createGroupedArray(consolidated, 10);
    this.fields = dropGroups.map((group) => {
      return {
        name: '\u200B',
        value: group.join('\n'),
        inline: false,
      };
    });
  }
}

module.exports = DropsEmbed;
