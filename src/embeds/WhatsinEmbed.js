'use strict';

const rpad = require('right-pad');
const lpad = require('pad-left');
const BaseEmbed = require('./BaseEmbed.js');

/**
 * Generates enemy embeds
 */
class WhatsinEmbed extends BaseEmbed {
  /**
   * @param {Genesis} bot - An instance of Genesis
   * @param {Object} details details to derive data from
   * @param {string} tier Relic tier
   * @param {string} type Relic type
   */
  constructor(bot, details, tier, type) {
    super();
    const transformedRewards = {};
    const rewards = [details.rewards.Intact, details.rewards.Exceptional,
      details.rewards.Flawless, details.rewards.Radiant];
    rewards
      .forEach((rewardTier) => {
        rewardTier.forEach((reward) => {
          if (!transformedRewards[reward.itemName]) {
            transformedRewards[reward.itemName] = [];
          }
          if (!transformedRewards[reward.itemName][rewards.indexOf(rewardTier)]) {
            transformedRewards[reward.itemName][rewards.indexOf(rewardTier)] = reward.chance;
          }
        });
      });

    const longest = Object.keys(transformedRewards).reduce((a, b) => (a.length > b.length ? a : b));
    const tokens = [];
    Object.keys(transformedRewards).forEach((rewardName) => {
      const reward = transformedRewards[rewardName];
      const qualities = [];
      reward.forEach((quality) => {
        const wrappedQuality = lpad(`${quality.toFixed(2)}`, 6, '\u2003').substring(0, 5);
        qualities.push(wrappedQuality);
      });
      tokens.push(`${rpad(rewardName, longest.length + 1, '\u2003')} ${qualities.join('/')}%`);
    });


    this.title = `${tier} ${type}`;
    this.color = 0x3498db;
    this.type = 'rich';
    this.fields = [
      {
        name: '\u200B',
        value: `\`\`\`${tokens.join('\n')}\`\`\``,
      },
    ];
  }
}

module.exports = WhatsinEmbed;
