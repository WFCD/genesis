import { assetBase } from '../utilities/CommonFunctions.js';

import BaseEmbed from './BaseEmbed.js';

const arcaneThumb = `${assetBase}/img/arcane.png`;
const colors = {
  common: 0x443b25,
  uncommon: 0x95bacd,
  rare: 0xc8be92,
};

export default class EnhancementEmbed extends BaseEmbed {
  constructor(enhancement, { enhancements }) {
    super();

    this.setThumbnail(arcaneThumb);
    if (enhancement && typeof enhancement !== 'undefined') {
      this.setTitle(enhancement.name);
      this.setURL(enhancement.info);
      this.setThumbnail(enhancement.thumbnail);
      this.setColor(colors[enhancement.rarity.toLowerCase()]);
      this.setFields([
        {
          name: 'Effect',
          value: enhancement.effect,
          inline: false,
        },
        {
          name: 'Rarity',
          value: enhancement.rarity,
          inline: false,
        },
        {
          name: 'Location',
          value: enhancement.location,
          inline: false,
        },
      ]);
    } else {
      this.setTitle('Available Enhancements');
      this.setFields([{ name: '\u200B', value: enhancements.map((profile) => profile.name).join('\n') }]);
    }
  }
}
