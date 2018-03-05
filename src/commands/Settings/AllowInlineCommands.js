'use strict';

const Command = require('../../Command.js');
const { getChannel } = require('../../CommonFunctions.js');


class AllowInlineCommands extends Command {
  constructor(bot) {
    super(bot, 'settings.allowinline', 'allow inline commands', 'Toggle whether or not inline commands are allowed here.');
    this.usages = [
      { description: 'Change if this channel can use inline commands', parameters: ['inline commands enabled'] },
    ];
    this.regex = new RegExp('^allow\\s?inline(?:\\s?commands)?\\s?(on|off)?(?:\\s+in\\s+((?:\\<\\#)?\\d+(?:\\>)?|here))?$', 'i');
    this.requiresAuth = true;
    this.allowDM = false;
  }

  async run(message) {
    let enable = message.strippedContent.match(this.regex)[1];
    const channelParam = message.strippedContent.match(this.regex)[2] ? message.strippedContent.match(this.regex)[2].trim().replace(/<|>|#/ig, '') : undefined;
    const channel = getChannel(channelParam, message, message.guild.channels);
    if (!enable) {
      const embed = {
        title: 'Usage',
        type: 'rich',
        color: 0x0000ff,
        fields: [
          {
            name: `${this.bot.prefix}${this.call} <on|off>`,
            value: '_ _',
          },
        ],
      };
      this.messageManager.embed(message, embed, true, true);
      return this.messageManager.statuses.FAILURE;
    }
    enable = enable.trim();
    let allowInline = false;
    if (enable === 'on') {
      allowInline = true;
    }
    await this.bot.settings.setChannelSetting(channel, 'allowInline', allowInline);
    this.messageManager.notifySettingsChange(message, true, true);
    return this.messageManager.statuses.SUCCESS;
  }
}

module.exports = AllowInlineCommands;
