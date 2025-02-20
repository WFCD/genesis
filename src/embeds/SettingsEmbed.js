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
    this.setColor(0x77dd77);
    if (channel.type === 'GUILD_TEXT') {
      this.setTitle(i18n`Settings for ${channel.name}`);
    } else {
      this.setTitle(i18n`Settings for DM with ${channel.recipient.username}`);
    }

    this.setFields([]);
    tokens.forEach((tokenGroup) => {
      this.addFields([{ name: '\u200B', value: tokenGroup.join('\n') }]);
    });
  }
}
