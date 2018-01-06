'use strict';

const BaseEmbed = require('./BaseEmbed.js');

/**
 * Generates daily deal embeds
 */
class DarvoEmbed extends BaseEmbed {
  /**
   * @param {Genesis} bot - An instance of Genesis
   * @param {DailyDeal} deal - The deal to be included in the embed
   * @param {string} platform - platform
   */
  constructor(bot, deal, { platform = 'pc', language = 'en' }) {
    super();

    this.color = 0x0000ff;
    this.title = bot.stringManager.getString('darvo_title', undefined, {
      language, replacements: { platform: platform.toUpperCase() },
    });
    this.thumbnail = {
      url: 'http://i.imgur.com/UotylUm.png',
    };
    this.fields = [
      {
        name: bot.stringManager.getString('darvo_remaining', undefined, {
          language,
          replacements: {
            item: deal.item,
            sale: deal.salePrice,
            remaining: deal.total - deal.sold,
            total: deal.total,
          },
        }),
        value: bot.stringManager.getString('darvo_original_expires', undefined, {
          language,
          replacements: {
            original: deal.originalPrice,
            eta: deal.eta,
          },
        }),
      },
    ];
  }
}

module.exports = DarvoEmbed;
