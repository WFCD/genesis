'use strict';

const BaseEmbed = require('./BaseEmbed.js');

/**
 * Generates sortie embeds
 */
class SortieEmbed extends BaseEmbed {
  /**
   * @param {Genesis} bot - An instance of Genesis
   * @param {Sortie} sortie - The sortie to be included in the embed
   */
  constructor(bot, sortie) {
    super();

    this.color = 0x00ff00;
    this.fields = sortie.variants.map(v => ({
      name: `${v.node} - ${v.missionType}`,
      value: v.modifier,
    }));
    this.fields.push({ name: '_ _', value: `Ends in ${sortie.getETAString()}` });

    this.title = 'Worldstate - Sortie';
    this.description = `Currently in-progress sortie: **${sortie.getBoss()}**`;
    this.thumbnail = {
      url: 'http://i.imgur.com/wWBRhaB.png',
    };
  }
}

module.exports = SortieEmbed;
