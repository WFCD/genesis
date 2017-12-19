'use strict';

const BaseEmbed = require('./BaseEmbed.js');

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
      this.url = frame.info;
      this.thumbnail.url = frame.thumbnail;
      this.description = frame.description;
      this.footer = { text: `Drops from: ${frame.location}` };
      this.color = frame.color;
      this.fields = [
        {
          name: 'Profile',
          value: `[Frame Profile](${frame.url})${frame.prime_url ? `\n[Prime Intro](${frame.prime_url})` : ''}`,
          inline: false,
        },
        {
          name: '_ _',
          value: 'The stats in parentheses `()` denotes the prime variant\'s stats, if one exists.',
          inline: false,
        },
        {
          name: 'Minimum Mastery',
          value: `${frame.mr || 'N/A'}${frame.prime_mr ? ` (${frame.prime_mr})` : ''}`,
          inline: true,
        },
        {
          name: 'Health',
          value: `${frame.health || 'N/A'}${frame.prime_health ? ` (${frame.prime_health})` : ''}`,
          inline: true,
        },
        {
          name: 'Shields',
          value: `${frame.shield || 'N/A'}${frame.prime_shield ? ` (${frame.prime_shield})` : ''}`,
          inline: true,
        },
        {
          name: 'Armor',
          value: `${frame.armor || 'N/A'}${frame.prime_armor ? ` (${frame.prime_armor})` : ''}`,
          inline: true,
        },
        {
          name: 'Power',
          value: `${frame.power || 'N/A'}${frame.prime_power ? ` (${frame.prime_power})` : ''}`,
          inline: true,
        },
        {
          name: 'Conclave',
          value: `${frame.conclave || 'N/A'}${frame.prime_conclave ? ` (${frame.prime_conclave})` : ''}`,
          inline: true,
        },
        {
          name: 'Aura',
          value: `${frame.aura || 'No Aura'}${frame.prime_aura ? ` (${frame.prime_aura})` : ''}`,
          inline: true,
        },
        {
          name: 'Polarities',
          value: `${frame.polarities.length > 0 ? frame.polarities.join(', ') : 'No polarities'}${frame.prime_polarities ? ` (${frame.prime_polarities.join(', ')})` : ''}`,
          inline: true,
        },
      ];
    } else {
      this.title = 'Available Warframes';
      this.fields = [{ name: '_ _', value: frames.map(stat => stat.name).join('\n') }];
    }
  }
}

module.exports = FrameEmbed;
