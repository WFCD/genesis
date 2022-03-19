'use strict';

const BaseEmbed = require('./BaseEmbed.js');

/**
 * Generates enemy embeds
 */
module.exports = class CommandIdEmbed extends BaseEmbed {
  /**
   * @param {Object} commands details to derive data from
   */
  constructor(commands) {
    super();
    this.fields = commands.map(group => ({ name: '\u200B', value: group.map(line => `\`${line}\``).join('\n') }));
    this.title = 'Accessible Command Ids';
    this.color = 0x3498db;
  }
};
