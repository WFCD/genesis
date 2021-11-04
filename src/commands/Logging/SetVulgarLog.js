'use strict';

const Command = require('../../models/Command.js');
const { captures } = require('../../CommonFunctions');

class SetVulgarLog extends Command {
  constructor(bot) {
    super(bot, 'settings.vulgarLog', 'set vulgar log', 'Sets the log channel for vulgar names of new members.', 'LOGGING');
    this.usages = [
      { description: 'Set the vulgarity log channel', parameters: ['channel id'] },
    ];
    this.regex = new RegExp(`^${this.call}\\s?${captures.channel}?$`, 'i');
    this.requiresAuth = true;
    this.allowDM = false;
  }

  async run(message) {
    const vulgarLogChannel = message.strippedContent.match(this.regex)[1];
    if (vulgarLogChannel && this.bot.client.channels.cache.has(vulgarLogChannel.trim())) {
      await this.settings.setGuildSetting(message.guild, 'vulgarLog', vulgarLogChannel);
      this.messageManager.notifySettingsChange(message, true, true);
      return this.constructor.statuses.SUCCESS;
    }
    await this.settings.deleteGuildSetting(message.guild, 'vulgarLog');
    this.messageManager.notifySettingsChange(message, true, true);
    return this.constructor.statuses.SUCCESS;
  }
}

module.exports = SetVulgarLog;
