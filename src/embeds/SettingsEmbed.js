'use strict';

const BaseEmbed = require('./BaseEmbed.js');

/**
 * Generates settings embeds
 */
class SettingsEmbed extends BaseEmbed {
  /**
   * @param {Genesis} bot - An instance of Genesis
   * @param {Channel} channel - The channel for which to send settings
   * @param {Array.<strings>} tokens -  The settngs to to display
   */
  constructor(bot, channel, tokens) {
    super();
    this.color = 0x77dd77;
    if (channel.type === 'GUILD_TEXT') {
      this.title = `Settings for ${channel.name}`;
    } else {
      this.title = `Settings for DM with ${channel.recipient.username}`;
    }

    this.fields = [];
    tokens.forEach((tokenGroup) => {
      this.fields.push({ name: '\u200B', value: tokenGroup.join('\n') });
    });
  }
}

module.exports = SettingsEmbed;
