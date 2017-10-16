'use strict';

const BaseEmbed = require('./BaseEmbed.js');

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

    this.color = state.isDay ? 0xB64624 : 0x000066;
    this.title = `Worldstate - ${state.isCetus ? 'Plains of Eidolon' : 'Earth'} Cycle`;
    this.thumbnail = {
      url: state.isCetus ? 'https://i.imgur.com/Ph337PR.png' : 'https://i.imgur.com/oR6Sskf.png',
    };
    this.fields = [
      {
        name: `Operator, ${state.isCetus ? 'the Plains of Eidolon are' : 'Earth is'} currently in ${state.isDay ? 'Day' : 'Night'}time`,
        value: `Time remaining until ${state.isDay ? 'night' : 'day'}: ${state.timeLeft}\n` +
          `${state.isDay ? 'Night' : 'Day'} starts at ${new Date(state.expiry).toLocaleString()}`,
      },
    ];
  }
}

module.exports = EarthCycleEmbed;
