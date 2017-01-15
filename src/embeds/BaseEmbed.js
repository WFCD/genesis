'use strict';

/**
 * Utility class for making rich embeds
 */
class BaseEmbed {
  /**
   * @param {Genesis} bot - An instance of Genesis
   */
  constructor(bot) {
    this.url = 'https://warframe.com';

    this.footer = {
      icon_url: 'https://avatars1.githubusercontent.com/u/24436369',
      text: 'Data evaluated by warframe-wordstate-parser, Warframe Community Developers',
    };
  }
}

module.exports = BaseEmbed;
