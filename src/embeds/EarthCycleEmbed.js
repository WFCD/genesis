'use strict';

const BaseEmbed = require('./BaseEmbed.js');

/**
 * Generates Earth cycle embeds
 */
class EarthCycleEmbed extends BaseEmbed {
  /**
   * @param {Genesis} bot - An instance of Genesis
   * @param {Object} state - The current state of the cycle
   * @param {string} platform - platform
   */
  constructor(bot, state, platform) {
    super();

    this.color = state.isDay ? 0x00ff00 : 0x000066;
    this.title = `[${platform.toUpperCase()}] Worldstate - Earth Cycle`;
    this.thumbnail = {
      url: 'http://vignette1.wikia.nocookie.net/warframe/images/1/1e/Earth.png',
    };
    this.fields = [
      {
        name: `Operator, Earth is currently in ${state.isDay ? 'Day' : 'Night'}time`,
        value: `Time remaining until ${state.isDay ? 'night' : 'day'}: ${state.timeLeft}\n` +
          `${state.isDay ? 'Night' : 'Day'} starts at ${new Date(state.expiry).toLocaleString()}`,
      },
    ];
  }
}

module.exports = EarthCycleEmbed;
