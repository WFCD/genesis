'use strict';

const Command = require('../../models/Command.js');

class SetLFGChannel extends Command {
  constructor(bot) {
    super(bot, 'settings.lfgChannel', 'set lfg channel', 'Sets the LFG Channel.');
    this.usages = [
      { description: 'Set the LFG channel', parameters: ['channel id'] },
    ];
    this.regex = new RegExp(`^${this.call}\\s?(\\d+)?$`, 'i');
    this.requiresAuth = true;
    this.allowDM = false;
  }

  /**
   * Run the command
   * @param {Message} message Message with a command to handle, reply to,
   *                          or perform an action based on parameters.
   * @returns {string} success status
   */
  async run(message) {
    const channel = message.strippedContent.match(this.regex)[1];
    if (channel && this.bot.client.channels.has(channel.trim())) {
      await this.settings.setGuildSetting(message.guild, 'lfgChannel', channel);
      this.messageManager.notifySettingsChange(message, true, true);
      return this.messageManager.statuses.SUCCESS;
    }
    await this.settings.deleteGuildSetting(message.guild, 'lfgChannel');
    this.messageManager.notifySettingsChange(message, true, true);
    return this.messageManager.statuses.SUCCESS;
  }
}

module.exports = SetLFGChannel;
