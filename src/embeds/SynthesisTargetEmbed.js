'use strict';

const BaseEmbed = require('./BaseEmbed.js');
const { assetBase } = require('../CommonFunctions');

const scannerThumb = `${assetBase}/img/synthesis-scanner.png`;

/**
 * Generates synthesis target embeds
 */
class SynthesisTargetEmbed extends BaseEmbed {
  /**
   * @param {Genesis} bot - An instance of Genesis
   * @param {Array.<SynthesisTarget>} synthTargets - The synthesis targets to send info on
   * @param {string} query - The user's query
   */
  constructor(bot, synthTargets, query) {
    super();

    this.thumbnail = {
      url: scannerThumb,
    };
    if (synthTargets.length === 1) {
      this.title = synthTargets[0].name;
      this.fields = synthTargets[0].locations.map(loc => ({
        name: `${loc.mission}, ${loc.planet}`,
        value: `Faction: ${loc.faction}, Level: ${loc.level}, Spawn: ${loc.spawn_rate}`,
        inline: false,
      }));
    } else {
      this.title = `Multiple targets matching "${query}"`;
      this.fields = [{ name: '\u200B', value: synthTargets.map(t => t.name).join('\n') }];
      this.footer.text = 'Search through the results using the arrows below.';
    }
  }
}

module.exports = SynthesisTargetEmbed;
