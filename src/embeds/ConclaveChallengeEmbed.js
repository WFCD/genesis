'use strict';

const BaseEmbed = require('./BaseEmbed.js');
const { assetBase } = require('../CommonFunctions');

const conclaveThumb = `${assetBase}/img/conclave-lg.png`;

const values = ['all', 'day', 'week'];

const compareCCategory = (c, category) => ((c.category === category.toLowerCase()) || category.toLowerCase() === 'all') && !c.rootChallenge;

/**
 * Generates conclave challenge embeds
 */
class ConclaveChallengeEmbed extends BaseEmbed {
  /**
   * @param {Array.<ConclaveChallenge>} challenges - The challenges to be included in the embed
   * @param {string} category - The category of the challenges in the embed
   * @param {string} platform - The platform for the information
   */
  constructor(challenges, { category, platform, i18n }) {
    super();

    const categoryInValues = category && values.indexOf(category.toLowerCase()) !== -1;
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
        name: i18n`No such conclave category`,
        value: `Valid values: ${values.join(', ')}`,
      }];
    }
    this.title = `${platform ? `[${platform.toUpperCase()}] ` : ''}Current Challenges for category: ${category || 'none'}`;
    this.thumbnail = {
      url: conclaveThumb,
    };
  }
}

module.exports = ConclaveChallengeEmbed;
