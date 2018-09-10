'use strict';

const BaseEmbed = require('./BaseEmbed.js');
const { createGroupedArray } = require('../CommonFunctions.js');

/**
 * Utility class for making rich embeds
 */
class EnableInfoEmbed extends BaseEmbed {
  /**
   * @param {Genesis} bot - An instance of Genesis
   * @param {number} enable - 1 if enabling command, 0 if disabling
   * @param {Array<string>} params - list of params
   */
  constructor(bot, enable, params) {
    super();
    this.title = 'Settings to Change';
    this.type = 'rich';
    this.color = 0x0000ff;
    this.fields = [{ name: 'Command Ids', value: params[0].length > 1 ? 'No Commands' : '\u200B', inline: true }];

    createGroupedArray(params[0]).forEach((commandArray) => {
      this.fields.push({ name: '\u200B', value: commandArray.join('; '), inline: false });
    });
    if (params[1]) {
      this.fields.push({ name: 'Channels', value: params[1].join('; ') || 'No channels' });
    }
    if (params[2]) {
      this.fields.push({ name: 'User or Role', value: params[2].trim() ? params[2] : 'No user or role' });
    }
    this.fields.push({ name: 'Enable', value: enable === 1 ? 'Yes' : 'No' });
  }
}

module.exports = EnableInfoEmbed;
