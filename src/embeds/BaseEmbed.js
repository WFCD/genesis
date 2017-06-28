'use strict';

/**
 * Utility class for making rich embeds
 */
class BaseEmbed {
  /**
   * @param {Genesis} bot - An instance of Genesis
   */
  constructor() {
    this.footer = {
      icon_url: 'https://avatars1.githubusercontent.com/u/24436369',
      text: new Date().toLocaleString(),
    };
  }
}

module.exports = BaseEmbed;
