'use strict';

/**
 * Utility class for making rich embeds
 */
class BaseEmbed {
  constructor() {
    this.footer = {
      icon_url: 'https://avatars1.githubusercontent.com/u/24436369',
    };
    this.timestamp = new Date();
  }
}

module.exports = BaseEmbed;
