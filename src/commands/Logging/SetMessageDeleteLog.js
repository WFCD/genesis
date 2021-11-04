'use strict';

const Command = require('../../models/Command.js');
const { captures } = require('../../CommonFunctions');

class SetMessageDeleteLog extends Command {
  constructor(bot) {
    super(bot, 'settings.msgDeleteLog', 'set message delete log', 'Sets the log channel for message deletions.', 'LOGGING');
    this.usages = [
      { description: 'Set the message delete log channel', parameters: ['channel id'] },
    ];
    this.regex = new RegExp(`^${this.call}\\s?${captures.channel}?$`, 'i');
    this.requiresAuth = true;
    this.allowDM = false;
  }

  async run(message) {
    const logChannel = message.strippedContent.match(this.regex)[1];
    if (logChannel && this.bot.client.channels.cache.has(logChannel.trim())) {
      await this.settings.setGuildSetting(message.guild, 'msgDeleteLog', logChannel);
      this.messageManager.notifySettingsChange(message, true, true);
      return this.constructor.statuses.SUCCESS;
    }
    await this.settings.deleteGuildSetting(message.guild, 'msgDeleteLog');
    this.messageManager.notifySettingsChange(message, true, true);
    return this.constructor.statuses.SUCCESS;
  }
}

module.exports = SetMessageDeleteLog;
