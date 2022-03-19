'use strict';

const { MessageEmbed } = require('discord.js');

const defaults = {
  url: process.env.EMBED_URL || 'https://warframestat.us',
  icon: process.env.EMBED_ICON_URL || 'https://warframestat.us/wfcd_logo_color.png',
};

/**
 * Utility class for making rich embeds
 */
class BaseEmbed extends MessageEmbed {
  constructor() {
    super({
      url: defaults.url,
      description: '_ _',
      footer: {
        text: 'Sent',
        icon_url: defaults.icon,
      },
      timestamp: new Date(),
      thumbnail: {
        url: undefined,
      },
    });
  }
}

module.exports = BaseEmbed;
