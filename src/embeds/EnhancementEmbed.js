import BaseEmbed from './BaseEmbed.js';
import { assetBase } from '../utilities/CommonFunctions.js';

const arcaneThumb = `${assetBase}/img/arcane.png`;
const colors = {
  common: 0x443B25,
  uncommon: 0x95BACD,
  rare: 0xC8BE92,
};

export default class EnhancementEmbed extends BaseEmbed {
  constructor(enhancement, { enhancements }) {
    super();

    this.thumbnail = {
      url: arcaneThumb,
    };
    if (enhancement && typeof enhancement !== 'undefined') {
      this.title = enhancement.name;
      this.url = enhancement.info;
      this.thumbnail.url = enhancement.thumbnail;
      this.color = colors[enhancement.rarity.toLowerCase()];
      this.fields = [
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
      ];
    } else {
      this.title = 'Available Enhancements';
      this.fields = [{ name: '\u200B', value: enhancements.map(profile => profile.name).join('\n') }];
    }
  }
}
