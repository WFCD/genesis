'use strict';

const BaseEmbed = require('./BaseEmbed.js');

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
    this.color = 0x9370db;
    this.title = `LFG Posted by ${lfg.author.tag}`;
    this.fields = [
      { name: 'Where', value: lfg.location, inline: true },
      { name: 'Time', value: lfg.duration, inline: true },
      { name: 'Farming For', value: lfg.goal, inline: true },
      { name: 'Platform', value: lfg.platform, inline: true },
    ];
    this.footer.text = 'Posted';
  }
}

module.exports = LFGEmbed;
