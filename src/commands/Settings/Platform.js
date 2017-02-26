'use strict';

const Command = require('../../Command.js');

class Platform extends Command {
  constructor(bot) {
    super(bot, 'settings.platform', 'platform', 'Change a channel\'s platform');
    this.usages = [
      { description: 'Change this channel\'s platform', parameters: ['platform'] },
    ];
    this.regex = new RegExp(`${this.call}(?:\\s+([pcsxb14]{2,3}))?`, 'i');
  }

  run(message) {
    const platform = message.strippedContent.match(this.regex)[1];
    if (!platform || !this.bot.platforms.includes(platform.toLowerCase())) {
      message.channel.sendEmbed({
        title: 'Usage',
        type: 'rich',
        color: 0x0000ff,
        fields: [
          {
            name: `${this.bot.prefix}${this.call} <platform>`,
            value: `Platform is one of ${this.bot.platforms.join(', ')}`,
          },
        ],
      });
    } else {
      this.bot.settings.setChannelPlatform(message.channel, platform.toLowerCase())
      .then(() => this.messageManager.notifySettingsChange(message, true, true))
      .catch(this.logger.error);
    }
    if (message.deletable) {
      message.delete(5000).catch(this.logger.error);
    }
  }
}

module.exports = Platform;
