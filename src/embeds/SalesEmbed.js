import { assetBase } from '../utilities/CommonFunctions.js';

import BaseEmbed from './BaseEmbed.js';

const darvo = `${assetBase}/img/darvo-md.png`;
const makeSale = (sale, i18n) => ({
  name: i18n`${sale.item}, ${sale.premiumOverride}p ${sale.discount > 0 ? `${sale.discount}% off` : ''}`,
  value: i18n`Expires in ${sale.eta}`,
});

export default class SalesEmbed extends BaseEmbed {
  constructor(sales, { platform, i18n, locale }) {
    super(locale);

    this.setColor(0x0000ff);
    this.setTitle(
      (Array.isArray(sales) ? sales[0] : sales).isPopular
        ? i18n`[${platform.toUpperCase()}] Popular Sales`
        : i18n`[${platform.toUpperCase()}] Featured Deal`
    );
    this.setThumbnail(darvo);
    this.setFields(Array.isArray(sales) ? sales.map((sale) => makeSale(sale, i18n)) : [makeSale(sales, i18n)]);
  }
}
