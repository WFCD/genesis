'use strict';

const BaseEmbed = require('./BaseEmbed');

/**
 * Utility class for making rich embeds
 */
class CycleImageEmbed extends BaseEmbed {
  constructor(isDay) {
    super();
    this.color = isDay ? 0xB64624 : 0x000066;
    this.image = {
      url: 'attachment://cycle.png',
    };
  }
}

module.exports = CycleImageEmbed;
