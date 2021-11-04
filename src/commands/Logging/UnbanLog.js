'use strict';

const Command = require('../../models/Command.js');
const { captures } = require('../../CommonFunctions');

class SetUnBanLog extends Command {
  constructor(bot) {
    super(bot, 'settings.unbanLog', 'set unban log', 'Sets the log channel for unbans.', 'LOGGING');
    this.usages = [
      { description: 'Set the unban log channel', parameters: ['channel id'] },
    ];
    this.regex = new RegExp(`^${this.call}\\s?${captures.channel}?$`, 'i');
    this.requiresAuth = true;
    this.allowDM = false;
  }

  async run(message) {
    const logChannel = message.strippedContent.match(this.regex)[1];
    if (logChannel && this.bot.client.channels.cache.has(logChannel.trim())) {
      await this.settings.setGuildSetting(message.guild, 'unbanLog', logChannel);
      this.messageManager.notifySettingsChange(message, true, true);
      return this.constructor.statuses.SUCCESS;
    }
    await this.settings.deleteGuildSetting(message.guild, 'unbanLog');
    this.messageManager.notifySettingsChange(message, true, true);
    return this.constructor.statuses.SUCCESS;
  }
}

module.exports = SetUnBanLog;
