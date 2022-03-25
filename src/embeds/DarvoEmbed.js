import BaseEmbed from './BaseEmbed.js';
import { assetBase } from '../utilities/CommonFunctions.js';

const darvo = `${assetBase}/img/darvo-md.png`;

export default class DarvoEmbed extends BaseEmbed {
  constructor(deal, { platform, i18n, locale }) {
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
        value: `Original price: ${deal.originalPrice}p, expires in ${deal.eta}`,
      },
    ];
    this.footer.text = i18n`${deal.total - deal.sold}/${deal.total} left`;
  }
}
