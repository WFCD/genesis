'use strict';

const BaseEmbed = require('./BaseEmbed.js');

/**
 * Generates daily deal embeds
 */
class ConstructionEmbed extends BaseEmbed {
  /**
   * @param {Genesis} bot - An instance of Genesis
   * @param {Construction} constructionProgress - The current construction information
   * @param {string} platform - The platform the event is for
   */
  constructor(bot, constructionProgress, platform) {
    super();

    this.color = 0xff6961;
    this.fields = [{
      name: `[${platform}] Construction Status:`,
      value: '```' +
      `Razorback: ${construction.razorbackProgress}` +
      `Fomorian:  ${construction.fomorianProgress}` +
      `Unknown:   ${construction.unknwonProgress}` +
      '```'
    }];
  }
}

module.exports = ConstructionEmbed;
