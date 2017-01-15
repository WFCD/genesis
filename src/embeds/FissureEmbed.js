'use strict';

const BaseEmbed = require('./BaseEmbed.js');

/**
 * Generates fissure embeds
 */
class FissureEmbed extends BaseEmbed {
  /**
   * @param {Genesis} bot - An instance of Genesis
   * @param {Array.<Fissure>} fissures - The fissures to be included in the embed
   */
  constructor(bot, fissures) {
    super(bot);

    fissures.sort((a, b) => a.tierNum - b.tierNum);

    this.fields = fissures.map(f => ({
      name: `${f.missionType} ${f.tier}`,
      value: `[${f.getETAString()}] ${f.node} against ${f.enemy}`,
    }));
    if (fissures.length === 0) {
      this.fields = {
        name: 'Currently no fissures',
        value: '',
      };
    }

    this.color = fissures.length > 2 ? 0x00ff00 : 0xff0000;
    this.title = 'Worldstate - Void Fissures';
    this.description = 'Current Void Fissures';
    this.thumbnail = {
      url: 'https://raw.githubusercontent.com/aliasfalse/genesis/master/src/resources/voidFissure.png',
    };
  }
}

module.exports = FissureEmbed;
