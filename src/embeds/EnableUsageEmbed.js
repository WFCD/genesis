'use strict';

const BaseEmbed = require('./BaseEmbed.js');

/**
 * Utility class for making rich embeds
 */
class EnableUsageEmbed extends BaseEmbed {
  /**
   * @param {Genesis} bot - An instance of Genesis
   * @param {Array<string>} params - list of params
   * @param {number} enable 1 if enable, 0 if disable
   */
  constructor(bot, params, enable) {
    super();
    this.title = 'Usage';
    this.type = 'rich';
    this.color = 0x0000ff;
    this.description = `${bot.prefix}${enable === 1 ? 'enable' : 'disable'} <commandId> in <channel> for <user or role>`;
    this.fields = [
      {
        name: '<commandIds>',
        value: 'The command or commands to disable.\nSee `/getcommandids` for more information.\nOther accepted replacements: `*` for enabling all.',
      },
      {
        name: '<channel>',
        value: `Channel to disable a command for.\nOther accepted replacements: \`*\` for ${enable === 1 ? 'enabling' : 'disabling'} in all channels.`,
      },
      {
        name: '<user or role>',
        value: `Id of user or role to ${enable === 1 ? 'enable' : 'disable'} commands for. Will accept mentions in the future.\n`
          + 'Other accepted replacements: `*` for enabling for all users.',
      },
    ];

    if (params) {
      this.fields.push({ name: 'Provided parameters', value: params.join(' | ') });
    }
  }
}

module.exports = EnableUsageEmbed;
