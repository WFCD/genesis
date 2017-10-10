'use strict';

const BaseEmbed = require('./BaseEmbed.js');

/**
 * Generates sortie embeds
 */
class SortieEmbed extends BaseEmbed {
  /**
   * @param {Genesis} bot - An instance of Genesis
   * @param {Sortie} sortie - The sortie to be included in the embed
   * @param {string} platform - platform
   */
  constructor(bot, sortie, platform) {
    super();

    this.color = 0xa84300;
    if (typeof sortie !== 'undefined' && sortie) {
      this.fields = sortie.variants.map(v => ({
        name: `${v.node} - ${v.missionType}`,
        value: v.modifier,
      }));
      this.description = `Currently in-progress sortie: **${sortie.boss}**`;
      this.footer.text = `${sortie.eta} remaining | ${new Date().toLocaleString()}`;
    }

    this.title = `[${platform.toUpperCase()}] Worldstate - Sortie`;
    this.thumbnail = {
      url: 'http://i.imgur.com/wWBRhaB.png',
    };
  }
}

module.exports = SortieEmbed;
