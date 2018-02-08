'use strict';

const BaseEmbed = require('./BaseEmbed.js');
const rpad = require('right-pad');

/**
 * Generates enemy embeds
 */
class WhereisEmbed extends BaseEmbed {
  /**
   * @param {Genesis} bot - An instance of Genesis
   * @param {Object} resultsGroups details to derive data from
   * @param {string} query The query that this search corresponds to
   * @param {number} nameWidth Spacing for Names
   * @param {number} relicWidth Spacing for relics
   */
  constructor(bot, resultsGroups, query, nameWidth, relicWidth) {
    super();
    this.fields = [];

    resultsGroups.forEach((results) => {
      const mappedResults = results.map(result => `\`${rpad(result.item, nameWidth, ' ')} ` +
      `| ${rpad(result.place, relicWidth, ' ')} | ${result.rarity} @${parseFloat(result.chance).toFixed(2)}%\``);
      this.fields.push({ name: '_ _', value: mappedResults.join('\n') });
    });

    this.title = `${query}`;
    this.color = 0x3498db;
    this.type = 'rich';
  }
}

module.exports = WhereisEmbed;
