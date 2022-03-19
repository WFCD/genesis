'use strict';

const BaseEmbed = require('./BaseEmbed.js');

/**
 * Generates daily deal embeds
 */
class ConstructionEmbed extends BaseEmbed {
  /**
   * @param {Construction} constructionProgress - The current construction information
   * @param {string} platform - The platform the event is for
   */
  constructor(constructionProgress, { platform, i18n }) {
    super();

    this.color = 0xff6961;
    this.fields = [{
      name: i18n`[${platform.toUpperCase()}] Construction Status:`,
      value: i18n`\`Razorback: ${constructionProgress.razorbackProgress}\`
\`Fomorian:  ${constructionProgress.fomorianProgress}\`
\`Unknown:   ${constructionProgress.unknownProgress}\``,
    }];
  }
}

module.exports = ConstructionEmbed;
