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
  constructor(bot, constructionProgress, { platform = 'pc', language = 'en' }) {
    super();

    this.color = 0xff6961;
    this.fields = [{
      name: bot.stringManager.getString(
        'construction_title', undefined,
        { language, replacements: { platform: platform.toUpperCase() } },
      ),
      value: bot.stringManager.getString('construction_value', undefined, {
        language,
        replacements: {
          razerback: constructionProgress.razorbackProgress,
          fomorian: constructionProgress.fomorianProgress,
          unknown: constructionProgress.unknownProgress,
        },
      }),
    }];
  }
}

module.exports = ConstructionEmbed;
