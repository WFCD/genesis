'use strict';

const Command = require('../../models/Command.js');

class AllowPrivateRoom extends Command {
  constructor(bot) {
    super(bot, 'settings.allowprivateroom', 'allow private room', 'Set whether or not to allow the bot to create private rooms.', 'ROOMS');
    this.usages = [
      { description: 'Change if the bot is allowed to create private channels', parameters: ['private rooms allowed'] },
    ];
    this.regex = new RegExp(`^${this.call}\\s?(on|off)?$`, 'i');
    this.requiresAuth = true;
    this.allowDM = false;
  }

  /**
   * Run the command
   * @param {Message} message Message with a command to handle, reply to,
   *                          or perform an action based on parameters.
   * @param {Object} ctx Context object containing channel settings, caller information, etc.
   * @returns {string} success status
   */
  async run(message, ctx) {
    let enable = message.strippedContent.match(this.regex)[1];
    if (!enable) {
      return this.sendToggleUsage(message, ctx);
    }
    enable = enable.trim();
    await this.settings.setGuildSetting(message.guild, 'createPrivateChannel', enable === 'on');
    this.messageManager.notifySettingsChange(message, true, true);
    return this.messageManager.statuses.SUCCESS;
  }
}

module.exports = AllowPrivateRoom;
