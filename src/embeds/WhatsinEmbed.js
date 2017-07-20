'use strict';

const BaseEmbed = require('./BaseEmbed.js');
const rpad = require('right-pad');
const lpad = require('pad-left');

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
        value: details.rewards.map(drop => `\`${rpad(drop.name, longest.length + 1, ' ')} ` +
        `${lpad(drop.intact.value, 6, ' ').substring(0, 5)}/${lpad(drop.exceptional.value, 6, ' ').substring(0, 5)}` +
        `/${lpad(drop.flawless.value, 6, ' ').substring(0, 5)}/${lpad(drop.radiant.value, 6, ' ')}\``).join('\n'),
      },
    ];
  }
}

module.exports = WhatsinEmbed;
