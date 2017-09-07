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
   * @param {number} pageNumber - Whether or not this is a 'tracked' embed
   */
  constructor(bot, channel, tokens, pageNumber) {
    super();
    switch (pageNumber) {
      case 1:
        this.color = 0x3366ff;
        break;
      case 2:
        this.color = 0x6666cc;
        break;
      case 3:
      default:
        this.color = 0x77dd77;
        break;
    }
    this.url = 'https://wfcd.github.io/genesis';
    if (channel.type === 'text') {
      this.title = `Settings for ${channel.name}`;
    } else {
      this.title = `Settings for DM with ${channel.recipient.username}`;
    }

    this.fields = [];
    tokens.forEach((tokenGroup) => {
      this.fields.push({ name: '_ _', value: tokenGroup.join('\n') });
    });
    this.footer.text = `Part ${pageNumber}`;
  }
}

module.exports = SettingsEmbed;
