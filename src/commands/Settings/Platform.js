'use strict';

const Command = require('../../models/Command.js');
const { getChannel, captures, platforms } = require('../../CommonFunctions');

class Platform extends Command {
  constructor(bot) {
    super(bot, 'settings.platform', 'platform', 'Change a channel\'s platform');
    this.usages = [
      { description: 'Change this channel\'s platform', parameters: ['platform'] },
    ];
    this.regex = new RegExp(`^${this.call}(?:\\s+(${platforms.join('|')}))?(?:\\s+in\\s+(${captures.channel}|here))?$`, 'i');
    this.requiresAuth = true;
  }

  async run(message, ctx) {
    const platform = message.strippedContent.match(this.regex)[1];
    if (!platform || !platforms.includes(platform.toLowerCase())) {
      return this.sendToggleUsage(message, ctx, platforms);
    }
    const channelParam = message.strippedContent.match(this.regex)[2] ? message.strippedContent.match(this.regex)[2].trim().replace(/<|>|#/ig, '') : undefined;
    const channel = getChannel(channelParam, message);
    await this.settings.setChannelSetting(channel, 'platform', platform.toLowerCase());
    this.messageManager.notifySettingsChange(message, true, true);
    return this.messageManager.statuses.SUCCESS;
  }
}

module.exports = Platform;
