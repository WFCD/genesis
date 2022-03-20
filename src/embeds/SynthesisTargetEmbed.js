'use strict';

const BaseEmbed = require('./BaseEmbed.js');
const { assetBase } = require('../CommonFunctions');

const scannerThumb = `${assetBase}/img/synthesis-scanner.png`;

module.exports = class SynthesisTargetEmbed extends BaseEmbed {
  constructor(synthTargets, { query, i18n }) {
    super();

    this.thumbnail = {
      url: scannerThumb,
    };
    if (synthTargets.length === 1) {
      this.title = synthTargets[0].name;
      this.fields = synthTargets[0].locations.map(loc => ({
        name: i18n`${loc.mission}, ${loc.planet}`,
        value: i18n`Faction: ${loc.faction}, Level: ${loc.level}, Spawn: ${loc.spawn_rate}`,
        inline: false,
      }));
    } else {
      this.title = i18n`Multiple targets matching "${query}"`;
      this.fields = [{ name: '\u200B', value: synthTargets.map(t => t.name).join('\n') }];
      this.footer.text = i18n`Search through the results using the arrows below.`;
    }
  }
};
