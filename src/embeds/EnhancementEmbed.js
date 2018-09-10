'use strict';

const BaseEmbed = require('./BaseEmbed.js');

const colors = {
  common: 0x443B25,
  uncommon: 0x95BACD,
  rare: 0xC8BE92,
};

/**
 * Generates enemy embeds
 */
class EnhancementEmbed extends BaseEmbed {
  /**
   * @param {Genesis} bot - An instance of Genesis
   * @param {Enhancement} enhancement - The enhancement to send info on
   * @param {Array.<Enhancement>} enhancements - The enhancement to send info on
   */
  constructor(bot, enhancement, enhancements) {
    super();

    this.thumbnail = {
      url: 'https://i.imgur.com/tIBB0ea.png',
    };
    if (enhancement && typeof enhancement !== 'undefined') {
      this.title = enhancement.name;
      this.url = enhancement.info;
      this.thumbnail.url = enhancement.thumbnail;
      this.color = colors[enhancement.rarity.toLowerCase()];
      this.fields = [
        {
          name: 'Effect',
          value: enhancement.effect,
          inline: false,
        },
        {
          name: 'Rarity',
          value: enhancement.rarity,
          inline: false,
        },
        {
          name: 'Location',
          value: enhancement.location,
          inline: false,
        },
      ];
    } else {
      this.title = 'Available Enhancements';
      this.fields = [{ name: '\u200B', value: enhancements.map(profile => profile.name).join('\n') }];
    }
  }
}

module.exports = EnhancementEmbed;
