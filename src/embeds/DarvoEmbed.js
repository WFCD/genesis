import { assetBase } from '../utilities/CommonFunctions.js';

import BaseEmbed from './BaseEmbed.js';

const darvo = `${assetBase}/img/darvo-md.png`;

export default class DarvoEmbed extends BaseEmbed {
  constructor(deal, { platform, i18n, locale }) {
    super(locale);
    if (Array.isArray(deal)) [deal] = deal;
    this.setColor(0x0000ff);
    this.setTitle(i18n`[${platform.toUpperCase()}] Darvo Deal`);
    this.setThumbnail(darvo);
    this.setFields([
      {
        name: i18n`${deal.item}, ${deal.salePrice}p`,
        value: `Original price: ${deal.originalPrice}p, expires in ${deal.eta}`,
      },
    ]);
    this.setFooter({ text: i18n`${deal.total - deal.sold}/${deal.total} left` });
  }
}
