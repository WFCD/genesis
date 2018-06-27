'use strict';

const BaseEmbed = require('./BaseEmbed.js');
const { emojify } = require('../CommonFunctions.js');

/**
 * Generates enemy embeds
 */
class FrameEmbed extends BaseEmbed {
  /**
   * @param {Genesis} bot - An instance of Genesis
   * @param {Warframe} frame - The enhancement to send info on
   * @param {Array.<Warframe>} frames - List of available warframes
   */
  constructor(bot, frame, frames) {
    super();

    this.thumbnail = {
      url: 'https://i.imgur.com/tIBB0ea.png',
    };
    if (frame && typeof frame !== 'undefined') {
      this.title = frame.name;
      this.url = frame.wikiaUrl;
      this.thumbnail.url = frame.wikiaThumbnail;
      this.description = `_${frame.description}_`;
      if (frame.location) {
        this.footer = { text: `Drops from: ${frame.location}` };
      }
      this.color = frame.color;
      this.fields = [
        {
          name: 'Profile',
          value: `[Frame Profile](${frame.url})${frame.prime_url ? `\n[Prime Intro](${frame.prime_url})` : ''}`,
          inline: false,
        },
        {
          name: 'Minimum Mastery',
          value: frame.masteryReq || 'N/A',
          inline: true,
        },
        {
          name: 'Health',
          value: frame.health || 'N/A',
          inline: true,
        },
        {
          name: 'Shields',
          value: frame.shield || 'N/A',
          inline: true,
        },
        {
          name: 'Armor',
          value: frame.armor || 'N/A',
          inline: true,
        },
        {
          name: 'Power',
          value: frame.power || 'N/A',
          inline: true,
        },
        {
          name: 'Conclave',
          value: frame.conclave || 'N/A',
          inline: true,
        },
        {
          name: 'Aura',
          value: emojify(frame.aura || 'No Aura'),
          inline: true,
        },
        {
          name: 'Polarities',
          value: emojify(frame.polarities && frame.polarities.length > 0 ? frame.polarities.join(' ') : 'No polarities'),
          inline: true,
        },
        {
          name: 'Abilities',
          value: frame.abilities.map(ability => `\u200B\t**${ability.name}:**\n\t_${ability.description}_`).join('\n\u200B\n'),
        },
      ];
    } else {
      this.title = 'Available Warframes';
      this.fields = [{ name: '_ _', value: frames.map(stat => stat.name).join('\n') }];
    }
  }
}

module.exports = FrameEmbed;
