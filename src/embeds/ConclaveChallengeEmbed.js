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
  constructor(bot, challenges, category, platform) {
    super();

    const categoryInValues = typeof category !== 'undefined' && values.indexOf(category.toLowerCase()) !== -1;
    this.color = categoryInValues ? 0x00ff00 : 0xff0000;
    if (categoryInValues) {
      this.fields = challenges
        .filter(c => compareCCategory(c, category))
        .map(c => ({
          name: c.mode,
          value: `${c.description} expires in ${c.endString}`,
        }));
    } else {
      this.fields = [{
        name: 'No such conclave category',
        value: `Valid values: ${values.join(', ')}`,
      }];
    }
    this.title = `${platform ? `[${platform.toUpperCase()}] ` : ''}Current Challenges for category: ${category || 'none'}`;
    this.thumbnail = {
      url: 'http://i.imgur.com/KDzKPYA.png',
    };
  }
}

module.exports = ConclaveChallengeEmbed;
