import { assetBase } from '../utilities/CommonFunctions.js';
import { rTime } from '../utilities/Wrappers.js';

import BaseEmbed from './BaseEmbed.js';

const ostron = `${assetBase}/img/ostron-banner.png`;
const earth = `${assetBase}/img/earth-planet.png`;

export default class EarthCycleEmbed extends BaseEmbed {
  constructor(state, { i18n, locale }) {
    super(locale);

    this.setTitle(`${state.isCetus ? 'PoE' : 'Earth'} - ${state.isDay ? 'Day' : 'Night'}`);
    this.setColor(state.isDay ? 0xb64624 : 0x000066);
    this.setThumbnail(state.isCetus ? ostron : earth);
    const bountyExpiry = state.bountyExpiry ? rTime(state.bountyExpiry) : '';
    this.setDescription(
      i18n`Time remaining until ${state.isDay ? 'Night' : 'Day'}: ${rTime(state.expiry)}` +
        (state.bountyExpiry ? i18n`\nBounties expire in ${bountyExpiry}` : '')
    );
    this.setFooter({ text: i18n`${state.isDay ? i18n`Night` : i18n`Day`} starts ` });
    this.setTimestamp(new Date(state.expiry).getTime());
  }
}
