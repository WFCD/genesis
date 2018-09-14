'use strict';

const BaseEmbed = require('./BaseEmbed.js');

/**
 * Generates enemy embeds
 */
class CommandIdEmbed extends BaseEmbed {
  /**
   * @param {Genesis} bot - An instance of Genesis
   * @param {Object} commands details to derive data from
   */
  constructor(bot, commands) {
    super();
    this.fields = [];
    commands.forEach((group) => {
      this.fields.push({ name: '\u200B', value: group.map(line => `\`${line}\``).join('\n') });
    });
    this.title = 'Accessible Command Ids';
    this.color = 0x3498db;
    this.type = 'rich';
  }
}

module.exports = CommandIdEmbed;
