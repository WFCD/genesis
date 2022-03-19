'use strict';

const BaseEmbed = require('./BaseEmbed.js');

const { timeDeltaToString, fromNow, assetBase } = require('../CommonFunctions.js');

const ostron = `${assetBase}/img/ostron-banner.png`;
const earth = `${assetBase}/img/earth-planet.png`;

/**
 * Generates Earth cycle embeds
 */
class EarthCycleEmbed extends BaseEmbed {
  /**
   * @param {Object} state - The current state of the cycle
   */
  constructor(state, { i18n }) {
    super();

    this.title = `${state.isCetus ? 'PoE' : 'Earth'} - ${state.isDay ? 'Day' : 'Night'}`;
    this.color = state.isDay ? 0xB64624 : 0x000066;
    this.thumbnail = {
      url: state.isCetus ? ostron : earth,
    };
    this.description = i18n`Time remaining until ${state.isDay ? 'night' : 'day'}: ${timeDeltaToString(fromNow(new Date(state.expiry)))}`
      + i18n`${state.bountyExpiry ? `\nBounties expire in ${timeDeltaToString(fromNow(new Date(state.bountyExpiry)))}` : ''}`;
    this.footer.text = i18n`${state.isDay ? 'Night' : 'Day'} starts `;
    this.timestamp = new Date(state.expiry);
  }
}

module.exports = EarthCycleEmbed;
