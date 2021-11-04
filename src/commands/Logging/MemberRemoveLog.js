'use strict';

const Command = require('../../models/Command.js');
const { captures } = require('../../CommonFunctions');

class SetMemRemoveLog extends Command {
  constructor(bot) {
    super(bot, 'settings.memberRemoveLog', 'set member remove log', 'Sets the log channel for member removals.', 'LOGGING');
    this.usages = [
      { description: 'Set the member removal log channel', parameters: ['channel id'] },
    ];
    this.regex = new RegExp(`^${this.call}\\s?${captures.channel}?$`, 'i');
    this.requiresAuth = true;
    this.allowDM = false;
  }

  async run(message) {
    const logChannel = message.strippedContent.match(this.regex)[1];
    if (logChannel && this.bot.client.channels.cache.has(logChannel.trim())) {
      await this.settings.setGuildSetting(message.guild, 'memberRemoveLog', logChannel);
      this.messageManager.notifySettingsChange(message, true, true);
      return this.constructor.statuses.SUCCESS;
    }
    await this.settings.deleteGuildSetting(message.guild, 'memberRemoveLog');
    this.messageManager.notifySettingsChange(message, true, true);
    return this.constructor.statuses.SUCCESS;
  }
}

module.exports = SetMemRemoveLog;
