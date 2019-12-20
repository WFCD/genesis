'use strict';

const { MessageEmbed } = require('discord.js');

/**
 * Utility class for making rich embeds
 */
class BaseEmbed extends MessageEmbed{
  constructor(bot) {
    super({
      url: 'https://warframestat.us/',
      footer: {
        text: 'Sent',
        icon_url: 'https://warframestat.us/wfcd_logo_color.png',
      },
      timestamp: new Date()
    });
    if (bot) {
      this.bot = bot;
    }
  }
}

module.exports = BaseEmbed;
