import n from 'numeral';

import { assetBase, emojify } from '../utilities/CommonFunctions.js';
import { isActive, timeToEnd, timeUntil } from '../utilities/WorldState.js';

import BaseEmbed from './BaseEmbed.js';

const baroThumb = `${assetBase}/img/baro.png`;

export default class VoidTraderEmbed extends BaseEmbed {
  constructor(voidTrader, { platform, onDemand, i18n, locale }) {
    super(locale);

    const active = isActive(voidTrader);
    const endString = timeToEnd(voidTrader);
    const startString = timeUntil(voidTrader);
    this.color = active ? 0x0ec9ff : 0xff6961;

    if (active && voidTrader?.inventory?.length > 0) {
      this.fields = voidTrader?.inventory.map((i) => {
        const d = `${n(i.ducats).format('0a')}${onDemand ? emojify('ducats') : 'ducats'}`;
        const cr = `${n(i.credits).format('0a')}${onDemand ? emojify('credits') : '*cr*'}`;
        return {
          name: i.item,
          value: `${d} + ${cr}`,
          inline: true,
        };
      });
    } else {
      this.fields = [];
    }
    this.fields.push({
      name: i18n`Time until ${isActive(voidTrader) ? i18n`departure from` : i18n`arrival at`} ${voidTrader.location}`,
      value: `${active ? endString : startString}` || i18n`Data Pending`,
    });
    this.title = i18n`[${platform.toUpperCase()}] Worldstate - Void Trader`;
    this.thumbnail = {
      url: baroThumb,
    };
  }
}
