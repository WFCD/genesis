import BaseEmbed from './BaseEmbed.js';
import { assetBase } from '../utilities/CommonFunctions.js';
import { rTime } from '../utilities/Wrappers.js';

const ostron = `${assetBase}/img/ostron-banner.png`;
const earth = `${assetBase}/img/earth-planet.png`;

export default class EarthCycleEmbed extends BaseEmbed {
  constructor(state, { i18n, locale }) {
    super(locale);

    this.title = `${state.isCetus ? 'PoE' : 'Earth'} - ${state.isDay ? 'Day' : 'Night'}`;
    this.color = state.isDay ? 0xb64624 : 0x000066;
    this.thumbnail = {
      url: state.isCetus ? ostron : earth,
    };
    const bountyExpiry = state.bountyExpiry ? rTime(state.bountyExpiry) : '';
    this.description =
      i18n`Time remaining until ${state.isDay ? 'night' : 'day'}: ${rTime(state.expiry)}` +
      i18n`${state.bountyExpiry ? `\nBounties expire in ${bountyExpiry}` : ''}`;
    this.footer.text = i18n`${state.isDay ? i18n`Night` : i18n`Day`} starts `;
    this.timestamp = new Date(state.expiry).getTime();
  }
}
