import { assetBase } from '#shared/utilities/CommonFunctions';
import { eta } from '#shared/utilities/WorldState';

import BaseEmbed from './BaseEmbed';
import type { EmbedBuildOptions } from './embedOptions';

const darvo = `${assetBase}/img/darvo-md.png`;

/** Full-width item image shown after "Show Image" on `/darvo`. */
export class DarvoItemImageEmbed extends BaseEmbed {
  constructor(deal: { item: string }, imageUrl: string, { locale }: EmbedBuildOptions) {
    super(locale);
    this.color = 0x0000ff;
    this.title = deal.item;
    this.image = { url: imageUrl };
  }
}

export default class DarvoEmbed extends BaseEmbed {
  constructor(deal, { platform, i18n, locale }: EmbedBuildOptions) {
    super(locale);
    if (Array.isArray(deal)) [deal] = deal;
    this.color = 0x0000ff;
    this.title = i18n`[${platform.toUpperCase()}] Darvo Deal`;
    this.thumbnail = {
      url: darvo,
    };
    this.fields = [
      {
        name: i18n`${deal.item}, ${deal.salePrice}p`,
        value: `Original price: ${deal.originalPrice}p, expires in ${eta(deal)}`,
      },
    ];
    this.footer.text = i18n`${deal.total - deal.sold}/${deal.total} left`;
  }
}
