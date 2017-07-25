'use strict';

const BaseEmbed = require('./BaseEmbed.js');

/**
 * Generates simaris embeds
 */
class SimarisEmbed extends BaseEmbed {
  /**
   * @param {Genesis} bot - An instance of Genesis
   * @param {Simaris} simaris - The sanctuary state data to be included in the embed
   */
  constructor(bot, simaris) {
    super();

    this.thumbnail = {
      url: 'http://i.imgur.com/mRKOHyv.png',
    };
    this.title = 'Worldstate - Sanctuary';
    this.color = simaris.isTargetActive > 2 ? 0x00ff00 : 0xff0000;
    this.fields = [{ name: simaris.asString, value: '_ _' }];
  }
}

module.exports = SimarisEmbed;
