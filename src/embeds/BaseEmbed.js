'use strict';

/**
 * Utility class for making rich embeds
 */
class BaseEmbed {
  constructor(bot) {
    this.url = 'https://warframestat.us/';
    this.footer = {
      text: 'Sent',
      icon_url: 'https://warframestat.us/wfcd_logo_color.png',
    };
    this.fields = [];
    this.timestamp = new Date();
    if (bot) {
      this.bot = bot;
    }
  }
}

module.exports = BaseEmbed;
