import { assetBase } from '../utilities/CommonFunctions.js';

import BaseEmbed from './BaseEmbed.js';

const scannerThumb = `${assetBase}/img/synthesis-scanner.png`;

export default class SynthesisTargetEmbed extends BaseEmbed {
  constructor(synthTargets, { query, i18n }) {
    super();

    this.setThumbnail(scannerThumb);
    if (synthTargets.length === 1) {
      this.setTitle(synthTargets[0].name);
      this.setFields(
        synthTargets[0].locations.map((loc) => ({
          name: i18n`${loc.mission}, ${loc.planet}`,
          value: i18n`Faction: ${loc.faction}, Level: ${loc.level}, Spawn: ${loc.spawn_rate}`,
          inline: false,
        }))
      );
    } else {
      this.setTitle(i18n`Multiple targets matching "${query}"`);
      this.setFields([{ name: '\u200B', value: synthTargets.map((t) => t.name).join('\n') }]);
      this.setFooter({ text: i18n`Search through the results using the arrows below.` });
    }
  }
}
