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

    this.color = 0xa84300;
    if (typeof sortie !== 'undefined' && sortie) {
      this.fields = sortie.variants.map(v => ({
        name: `${v.node} - ${v.missionType}`,
        value: v.modifier,
      }));
      this.description = `Currently in-progress sortie: **${sortie.getBoss()}**`;
      this.footer.text = `${sortie.getETAString()} remaining | ${new Date().toLocaleString()}`;
    }

    this.title = 'Worldstate - Sortie';
    this.thumbnail = {
      url: 'http://i.imgur.com/wWBRhaB.png',
    };
  }
}

module.exports = SortieEmbed;
