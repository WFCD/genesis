import { assetBase } from '#shared/utilities/CommonFunctions';

import BaseEmbed from './BaseEmbed';
import type { EmbedBuildOptions } from './embedOptions';

const arcaneThumb = `${assetBase}/img/arcane.png`;
const colors = {
  common: 0x443b25,
  uncommon: 0x95bacd,
  rare: 0xc8be92,
};

export default class EnhancementEmbed extends BaseEmbed {
  constructor(enhancement, { enhancements }: EmbedBuildOptions) {
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
      this.fields = [
        { name: '\u200B', value: (enhancements as Array<{ name: string }>).map((profile) => profile.name).join('\n') },
      ];
    }
  }
}
