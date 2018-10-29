'use strict';

const BaseEmbed = require('./BaseEmbed.js');

const { timeDeltaToString, fromNow, assetBase } = require('../CommonFunctions.js');

const ostron = `${assetBase}/img/ostron-banner.png`;
const earth = `${assetBase}/img/earth-planet.png`

/**
 * Generates Earth cycle embeds
 */
class EarthCycleEmbed extends BaseEmbed {
  /**
   * @param {Genesis} bot - An instance of Genesis
   * @param {Object} state - The current state of the cycle
   */
  constructor(bot, state) {
    super();

    this.title = `Worldstate - ${state.isCetus ? 'Plains of Eidolon' : 'Earth'} Cycle - ${state.isDay ? 'Day' : 'Night'}time`;
    this.color = state.isDay ? 0xB64624 : 0x000066;
    this.thumbnail = {
      url: state.isCetus ? ostron : earth,
    };
    this.description = `Time remaining until ${state.isDay ? 'night' : 'day'}: ${timeDeltaToString(fromNow(new Date(state.expiry)))}`
      + `${state.bountyExpiry ? `\nBounties expire in ${timeDeltaToString(fromNow(new Date(state.bountyExpiry)))}` : ''}`;
    this.footer.text = `${state.isDay ? 'Night' : 'Day'} starts `;
    this.timestamp = new Date(state.expiry);
  }
}

module.exports = EarthCycleEmbed;
