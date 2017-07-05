'use strict';

const BaseEmbed = require('./BaseEmbed.js');
const rpad = require('right-pad');

/**
 * Generates enemy embeds
 */
class WhatsinEmbed extends BaseEmbed {
  /**
   * @param {Genesis} bot - An instance of Genesis
   * @param {Object} details details to derive data from
   */
  constructor(bot, details) {
    super();
    const longest = details.rewards.intact.map(drop => drop.name)
     .reduce((a, b) => (a.length > b.length ? a : b));

    this.title = `${details.tier} ${details.type} Intact`;
    this.color = 0x3498db;
    this.type = 'rich';
    this.fields = [
      {
        name: 'Intact',
        value: details.rewards.intact.map(drop => `\`${rpad(drop.name, longest.length + 1, ' ')}- ${drop.rarity.name} @ ${drop.rarity.value}\``).join('\n'),
        inline: true,
      },
      {
        name: 'Radiant',
        value: details.rewards.radiant.map(drop => `\`${rpad(drop.name, longest.length + 1, ' ')}- ${drop.rarity.name} @ ${drop.rarity.value}\``).join('\n'),
        inline: true,
      },
      {
        name: 'Exceptional',
        value: details.rewards.exceptional.map(drop => `\`${rpad(drop.name, longest.length + 1, ' ')}- ${drop.rarity.name} @ ${drop.rarity.value}\``).join('\n'),
        inline: true,
      },
      {
        name: 'Flawless',
        value: details.rewards.flawless.map(drop => `\`${rpad(drop.name, longest.length + 1, ' ')}- ${drop.rarity.name} @ ${drop.rarity.value}\``).join('\n'),
        inline: true,
      },
    ];
  }
}

module.exports = WhatsinEmbed;
