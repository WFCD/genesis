'use strict';

const Command = require('../../Command.js');
const { getChannel } = require('../../CommonFunctions');

class Platform extends Command {
  constructor(bot) {
    super(bot, 'settings.platform', 'platform', 'Change a channel\'s platform');
    this.usages = [
      { description: 'Change this channel\'s platform', parameters: ['platform'] },
    ];
    this.regex = new RegExp(`${this.call}(?:\\s+([pcsxb14]{2,3}))?(?:\\s+in\\s+((?:\\<\\#)?\\d+(?:\\>)?|here))?$`, 'i');
    this.requiresAuth = true;
  }

  async run(message) {
    const platform = message.strippedContent.match(this.regex)[1];
    if (!platform || !this.bot.platforms.includes(platform.toLowerCase())) {
      const embed = {
        title: 'Usage',
        type: 'rich',
        color: 0x0000ff,
        fields: [
          {
            name: `${this.bot.prefix}${this.call} <platform>`,
            value: `Platform is one of ${this.bot.platforms.join(', ')}`,
          },
        ],
      };
      this.messageManager.embed(message, embed, true, true);
      return this.messageManager.statuses.FAILURE;
    }
    const channelParam = message.strippedContent.match(this.regex)[2] ? message.strippedContent.match(this.regex)[2].trim().replace(/<|>|#/ig, '') : undefined;
    const channel = getChannel(channelParam, message);
    await this.bot.settings.setChannelSetting(channel, 'platform', platform.toLowerCase());
    this.messageManager.notifySettingsChange(message, true, true);
    return this.messageManager.statuses.SUCCESS;
  }
}

module.exports = Platform;
