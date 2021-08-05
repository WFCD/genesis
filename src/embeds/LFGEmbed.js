'use strict';

// eslint-disable-next-line no-unused-vars
const Discord = require('discord.js');

const BaseEmbed = require('./BaseEmbed.js');

const expiredC = process.env.LFG_EXPIRED_COLOR
  ? Number.parseInt(process.env.LFG_EXPIRED_COLOR, 16)
  : 0xff0000;
const activeC = process.env.LFG_ACTIVE_COLOR
  ? Number.parseInt(process.env.LFG_ACTIVE_COLOR, 16)
  : 0x9370db;

/**
 * A collection of strings that are used by the parser to produce markdown-formatted text
 * @typedef {Object.<string>} LFG
 * @property {Discord.User} author      - LFG Author
 * @property {string} location          - Where people would like to group
 * @property {string} duration          - How long to go for
 * @property {string} goal              - Goal to farm for
 * @property {string} platform          - What platform to recruit on
 */

/**
 * Generates LFG embeds
 */
class LFGEmbed extends BaseEmbed {
  /**
   * @param {Genesis} bot - An instance of Genesis
   * @param {LFG} lfg - LFG Options
   */
  constructor(bot, lfg) {
    super();
    this.color = lfg.expiry ? activeC : expiredC;
    this.title = `${lfg.types.length ? lfg.types.join(' & ') : 'LFG'} Posted by ${lfg.author.tag}`;
    this.fields = [
      { name: 'Where', value: lfg.location, inline: true },
      { name: 'Time', value: lfg.duration, inline: true },
      { name: 'Farming For', value: lfg.goal, inline: true },
      { name: 'Platform', value: lfg.platform.toUpperCase(), inline: true },
      { name: 'Need', value: `${lfg.membersNeeded - lfg.members.length}`, inline: true },
      { name: 'Members', value: lfg.members.map(id => `<@!${id}>`).join(', '), inline: true },
    ];

    if (lfg.vc.channel) {
      this.fields.push({
        name: 'Voice Chat',
        value: `<#${lfg.vc.channel.id}>`,
        inline: true,
      });
    }

    if (lfg.expiry !== 0) {
      this.fields.push({
        name: '_ _',
        value: `Expires <t:${(lfg.expiryTs / 1000).toFixed(0)}:R>`,
        inline: false,
      });
    }
    const ed = lfg.edited ? 'Edited' : 'Posted';
    this.footer.text = lfg.expiry === 0 ? `Expired • ${ed}` : ed;
  }
}

module.exports = LFGEmbed;
