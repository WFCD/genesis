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
      name: `[${platform.toUpperCase()}] Construction Status:`,
      value: '```' +
      `Razorback: ${constructionProgress.razorbackProgress}` +
      `Fomorian:  ${constructionProgress.fomorianProgress}` +
      `Unknown:   ${constructionProgress.unknwonProgress}` +
      '```',
    }];
  }
}

module.exports = ConstructionEmbed;
