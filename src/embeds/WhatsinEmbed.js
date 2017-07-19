'use strict';

const BaseEmbed = require('./BaseEmbed.js');

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
    const longest = details.rewards.map(drop => drop.name)
     .reduce((a, b) => (a.length > b.length ? a : b));

    this.title = `${details.tier} ${details.type}`;
    this.color = 0x3498db;
    this.type = 'rich';
    this.fields = [
      {
        name: '_ _',
        value: details.rewards.map(drop => `\`${drop.name.padEnd(longest.length + 1)} ${drop.intact.value.padStart(6).substring(0,5)}/${drop.exceptional.value.padStart(6).substring(0,5)}/${drop.flawless.value.padStart(6).substring(0,5)}/${drop.radiant.value.padStart(6)}\``).join('\n'),
      },
    ];
  }
}

module.exports = WhatsinEmbed;
