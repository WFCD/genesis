import BaseEmbed from './BaseEmbed.js';
import { assetBase } from '../utilities/CommonFunctions.js';

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
    const timeMention = `<t:${new Date(state.expiry) / 1000}:R>`;
    const bountyExpiry = state.bountyExpiry ? `<t:${new Date(state.bountyExpiry) / 1000}:R>` : '';
    this.description =
      i18n`Time remaining until ${state.isDay ? 'night' : 'day'}: ${timeMention}` +
      i18n`${state.bountyExpiry ? `\nBounties expire in ${bountyExpiry}` : ''}`;
    this.footer.text = i18n`${state.isDay ? i18n`Night` : i18n`Day`} starts `;
    this.timestamp = new Date(state.expiry);
  }
}
