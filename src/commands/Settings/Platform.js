'use strict';

const Command = require('../../Command.js');

class Platform extends Command {
  constructor(bot) {
    super(bot, 'settings.platform', 'platform', 'Change a channel\'s platform');
    this.usages = [
      { description: 'Change this channel\'s platform', parameters: ['platform'] },
    ];
    this.regex = new RegExp(`${this.call}(?:\\s+([pcsxb14]{2,3}))?(?:\\s+in\\s+((?:\\<\\#)?\\d+(?:\\>)?|here))?$`, 'i');
    this.requiresAuth = true;
  }

  run(message) {
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
    } else {
      const channelParam = message.strippedContent.match(this.regex)[2].trim().replace(/<|>|#/ig, '');
      const channel = this.getChannel(channelParam, message);
      this.bot.settings.setChannelPlatform(channel, platform.toLowerCase())
      .then(() => this.messageManager.notifySettingsChange(message, true, true))
      .catch(this.logger.error);
    }
  }

  /**
   * Get the list of channels to enable commands in based on the parameters
   * @param {string|Array<Channel>} channelsParam parameter for determining channels
   * @param {Message} message Discord message to get information on channels
   * @returns {Array<string>} channel ids to enable commands in
   */
  getChannel(channelsParam, message) {
    let channel = message.channel;
    if (typeof channelsParam === 'string') {
      // handle it for strings
      if (channelsParam !== 'here') {
        channel = this.bot.client.channels.get(channelsParam.trim());
      } else if (channelsParam === 'here') {
        channel = message.channel;
      }
    }
    return channel;
  }
}

module.exports = Platform;
