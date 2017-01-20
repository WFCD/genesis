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
    super(bot);

    this.thumbnail = {
      url: 'https://github.com/aliasfalse/genesis/raw/master/src/resources/simaris.png',
    };
    this.title = 'Worldstate - Sanctuary';
    this.description = 'Current Sanctuary status:';
    this.color = simaris.isTargetActive > 2 ? 0x00ff00 : 0xff0000;
    this.fields = [{ name: simaris.toString(), value: '_ _' }];
  }
}

module.exports = SimarisEmbed;
