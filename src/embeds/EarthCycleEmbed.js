'use strict';

const BaseEmbed = require('./BaseEmbed.js');

const { timeDeltaToString, fromNow } = require('../CommonFunctions.js');

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
      url: state.isCetus ? 'https://i.imgur.com/Ph337PR.png' : 'https://i.imgur.com/oR6Sskf.png',
    };
    this.fields = [
      {
        name: '_ _',
        value: `Time remaining until ${state.isDay ? 'night' : 'day'}: ${timeDeltaToString(fromNow(new Date(state.expiry)))}` +
          `${state.bountyExpiry ? `\nBounties expire in ${timeDeltaToString(fromNow(new Date(state.bountyExpiry)))}` : ''}`,
      },
    ];
    this.footer.text = `${state.isDay ? 'Night' : 'Day'} starts `;
    this.timestamp = new Date(state.expiry);
  }
}

module.exports = EarthCycleEmbed;
