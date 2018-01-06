'use strict';

const BaseEmbed = require('./BaseEmbed.js');

const values = ['all', 'day', 'week'];

const compareCCategory = (c, category) => ((c.category === category.toLowerCase()) || category.toLowerCase() === 'all') && !c.rootChallenge;

/**
 * Generates conclave challenge embeds
 */
class ConclaveChallengeEmbed extends BaseEmbed {
  /**
   * @param {Genesis} bot - An instance of Genesis
   * @param {Array.<ConclaveChallenge>} challenges - The challenges to be included in the embed
   * @param {string} category - The category of the challenges in the embed
   * @param {string} platform - The platform for the information
   */
  constructor(bot, challenges, { platform = 'pc', language = 'en', category }) {
    super();
    const useableCategory = category || challenges[0] ? challenges[0].category.trim() : 'all';
    const categoryInValues = typeof useableCategory !== 'undefined' && values.indexOf(useableCategory.toLowerCase()) !== -1;
    this.color = categoryInValues ? 0x00ff00 : 0xff0000;
    if (categoryInValues) {
      this.fields = challenges
        .filter(c => compareCCategory(c, useableCategory))
        .map(c => ({
          name: c.mode,
          value: bot.stringManager.getString('desc_w_expire', undefined, {
            language,
            replacements: { 0: c.description, 1: c.endString },
          }),
        }));
    } else {
      this.fields = [{
        name: 'No such conclave category',
        value: `Valid values: ${values.join(', ')}`,
      }];
    }
    this.title = bot.stringManager.getString('conclave_title', undefined, {
      language,
      replacements: { platform: platform ? `[${platform.toUpperCase()}] ` : '', category: useableCategory || 'none' },
    });
    this.thumbnail = {
      url: 'http://i.imgur.com/KDzKPYA.png',
    };
  }
}

module.exports = ConclaveChallengeEmbed;
