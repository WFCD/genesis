'use strict';

/**
 * Utility class for making rich embeds
 */
class BaseEmbed {
  constructor() {
    this.url = 'https://warframestat.us/';
    this.footer = {
      icon_url: 'https://warframestat.us/wfcd_logo_color.png',
    };
    this.timestamp = new Date();
  }
}

module.exports = BaseEmbed;
