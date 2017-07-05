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
    this.title = `${details.tier} ${details.type}`;
    this.color = 0x3498db;
    this.type = 'rich';
    this.fields = [
      {
        name: '_ _',
        value: details.rewards.intact.map(drop => drop.name).join('\n'),
      },
    ];
  }
}

module.exports = WhatsinEmbed;
