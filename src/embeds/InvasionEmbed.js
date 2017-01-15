'use strict';

const BaseEmbed = require('./BaseEmbed.js');

/**
 * Generates invasion embeds
 */
class InvasionEmbed extends BaseEmbed {
  /**
   * @param {Genesis} bot - An instance of Genesis
   * @param {Array.<Invasion>} invasions - The invasions to be included in the embed
   */
  constructor(bot, invasions) {
    super(bot);

    this.color = invasions.length > 2 ? 0x00ff00 : 0xff0000;
    this.fields = invasions.map((i) => {
      let rewards = i.defenderReward.toString();
      if (!i.vsInfestation) {
        rewards = `${i.attackerReward} vs ${rewards}`;
      }

      return {
        name: `${rewards} - ${Math.round(i.completion * 100) / 100}%`,
        value: `${i.desc} on ${i.node} - ETA ${i.getETAString()}`,
      };
    });
    this.title = 'Worldstate - Invasions';
    this.description = 'Currently in-progress invasions:';
    this.thumbnail = {
      url: 'https://raw.githubusercontent.com/aliasfalse/genesis/master/src/resources/invasion.png',
    };
  }
}

module.exports = InvasionEmbed;
