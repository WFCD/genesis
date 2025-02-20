import BaseEmbed from './BaseEmbed.js';

export default class WhereisEmbed extends BaseEmbed {
  /**
   * @param {Object} resultsGroups details to derive data from
   * @param {string} query The query that this search corresponds to
   * @param {number} nameWidth Spacing for Names
   * @param {number} relicWidth Spacing for relics
   */
  constructor(resultsGroups, query, nameWidth, relicWidth) {
    super();
    this.fields = [];

    resultsGroups.forEach((results, index) => {
      const mappedResults = results.map((result) => {
        const item = result.item.replace('Blueprint', 'BP').replace(' Prime', ' P.').padEnd(nameWidth, '\u2003');
        const place = (result.place.split('/')[1] || result.place).padEnd(relicWidth, '\u2003');
        const chance = `${result.rarity.charAt(0)}@${result.chance}`;
        return `\`${item} | ${place} | ${chance}\``;
      });

      const value = mappedResults.join('\n');
      if (index > 0) {
        this.addFields([{ name: '\u200B', value }]);
      } else {
        this.setDescription(value);
      }
    });

    this.setTitle(`${query}`);
    this.setColor(0x3498db);
  }
}
