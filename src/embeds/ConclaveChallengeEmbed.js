'use strict';

const BaseEmbed = require('./BaseEmbed.js');

const values = ['all', 'day', 'week'];

/**
 * Generates conclave challenge embeds
 */
class ConclaveChallengeEmbed extends BaseEmbed {
  /**
   * @param {Genesis} bot - An instance of Genesis
   * @param {Array.<ConclaveChallenge>} challenges - The challenges to be included in the embed
   * @param {string} category - The category of the challenges in the embed
   */
  constructor(bot, challenges, category) {
    super(bot);

    const categoryInValues = values.indexOf(category.toLowerCase()) !== -1;
    this.color = categoryInValues ? 0x00ff00 : 0xff0000;
    if (categoryInValues) {
      this.fields = challenges.filter(
        c => (c.category === category.toLowerCase() || category.toLowerCase() === 'all') &&
        !c.isRootChallenge()).map(c => ({
          name: c.mode,
          value: `${c.description} expires in ${c.getEndString()}`,
        }));
    } else {
      this.fields = [{
        name: 'No such conclave category',
        value: `Valid values: ${values.join(', ')}`,
      }];
    }
    this.title = 'Worldstate - Conclave Challenges';
    this.description = `Current Challenges for category: ${category || 'none'}`;
    this.thumbnail = {
      url: 'https://raw.githubusercontent.com/aliasfalse/genesis/master/src/resources/conclave.png',
    };
  }
}

module.exports = ConclaveChallengeEmbed;
