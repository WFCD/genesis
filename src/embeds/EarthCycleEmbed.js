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

    this.color = state.dayTime ? 0x00ff00 : 0x000066;
    this.title = 'Worldstate - Earth Cycle';
    this.description = 'Current Earth Day/Night Cycle:';
    this.thumbnail = {
      url: 'http://vignette1.wikia.nocookie.net/warframe/images/1/1e/Earth.png',
    };
    this.fields = [
      {
        name: `Operator, Earth is currently in ${state.dayTime ? 'Day' : 'Night'}time`,
        value: `Time remaining until ${state.dayTime ? 'night' : 'day'}: ${state.timeLeft}`,
      },
    ];
  }
}

module.exports = EarthCycleEmbed;
