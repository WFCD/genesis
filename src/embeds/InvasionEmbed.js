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
    super();

    this.color = 0x3498db;
    if (invasions.length > 1) {
      this.fields = invasions.map((i) => {
        let rewards = i.defenderReward.toString();
        if (!i.vsInfestation) {
          rewards = `${i.attackerReward} vs ${rewards}`;
        }
        const completion = Math.round(i.completion * 100) / 100;
        return {
          name: `${rewards} - ${completion > 0 ? completion : 0}%`,
          value: `${i.desc} on ${i.node} - ETA ${i.getETAString()}`,
        };
      });
      this.title = 'Worldstate - Invasions';
      this.description = 'Currently in-progress invasions:';
    } else {
      const i = invasions[0];
      let rewards = i.defenderReward.toString();
      if (!i.vsInfestation) {
        rewards = `${i.attackerReward} vs ${rewards}`;
      }
      const completion = Math.round(i.completion * 100) / 100;
      this.title = `${rewards} - ${completion > 0 ? completion : 0}%`;
      this.description = i.desc;
      this.fields = [
        { name: 'Location', value: i.node, inline: true },
      ];
      this.footer.text = `${i.getETAString().replace(/-?Infinityd/ig, '\u221E')} remaining | ${new Date().toLocaleString()}`;
    }

    this.thumbnail = {
      url: 'https://raw.githubusercontent.com/aliasfalse/genesis/master/src/resources/invasion.png',
    };
  }
}

module.exports = InvasionEmbed;
