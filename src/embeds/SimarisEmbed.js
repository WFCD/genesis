'use strict';

const BaseEmbed = require('./BaseEmbed.js');
const { assetBase } = require('../CommonFunctions');

const simarisThumb = `${assetBase}/img/simaris.png`;

/**
 * Generates simaris embeds
 */
class SimarisEmbed extends BaseEmbed {
  /**
   * @param {Genesis} bot - An instance of Genesis
   * @param {Simaris} simaris - The sanctuary state data to be included in the embed
   * @param {string} platform - Platform
   */
  constructor(bot, simaris, platform) {
    super();

    this.thumbnail = {
      url: simarisThumb,
    };
    this.title = `[${platform.toUpperCase()}] Worldstate - Sanctuary`;
    this.color = simaris.isTargetActive > 2 ? 0x00ff00 : 0xff0000;
    this.fields = [{ name: simaris.asString, value: '\u200B' }];
  }
}

module.exports = SimarisEmbed;
