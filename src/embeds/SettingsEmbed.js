import BaseEmbed from './BaseEmbed.js';

/**
 * Generates settings embeds
 */
export default class SettingsEmbed extends BaseEmbed {
  /**
   * @param {Channel} channel - The channel for which to send settings
   * @param {Array.<strings>} tokens -  The settings to display
   * @param {I18n} i18n internationalizer
   */
  constructor(channel, { tokens, i18n }) {
    super();
    this.color = 0x77dd77;
    if (channel.type === 'GUILD_TEXT') {
      this.title = i18n`Settings for ${channel.name}`;
    } else {
      this.title = i18n`Settings for DM with ${channel.recipient.username}`;
    }

    this.fields = [];
    tokens.forEach((tokenGroup) => {
      this.fields.push({ name: '\u200B', value: tokenGroup.join('\n') });
    });
  }
}
