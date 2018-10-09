'use strict';

const BaseEmbed = require('./BaseEmbed.js');

/**
 * Generates synthesis target embeds
 */
class SynthesisTargetEmbed extends BaseEmbed {
  /**
   * @param {Genesis} bot - An instance of Genesis
   * @param {Array.<SynthesisTarget>} synthTargets - The synthesis targets to send info on
   * @param {String} query - The user's query
   */
  constructor(bot, synthTargets, query) {
    super();

    this.thumbnail = {
      url: 'https://i.imgur.com/4Awre4E.png',
    };
    if (synthTargets.length == 1) {
      this.title = synthTargets[0].name;
      // this.url = enhancement.info;
      // this.thumbnail.url = enhancement.thumbnail;
      // this.color = colors[enhancement.rarity.toLowerCase()];
      this.fields = synthTargets[0].locations.map((loc) => {
        return {
          name: `${loc.mission}, ${loc.planet}`, 
          value: `Faction: ${loc.faction}, Level: ${loc.level}, Spawn: ${loc.spawn_rate}`, 
          inline: false,
        }
      });
    } else {
      this.title = 'Multiple Targets matching "' + query + '"';
      this.fields = [{ name: '\u200B', value: synthTargets.map(t => t.name).join('\n') }];
      this.footer.text = 'Search through the results using the arrows below.'
    }
  }
}

module.exports = SynthesisTargetEmbed;
