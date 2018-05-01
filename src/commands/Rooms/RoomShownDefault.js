'use strict';

const Command = require('../../models/Command.js');

class RoomShownDefault extends Command {
  constructor(bot) {
    super(bot, 'settings.defaultroomsshown', 'set rooms shown', 'Set whether or not to the bot should default rooms to being unlocked (public).');
    this.usages = [
      { description: 'Change if the bot should create shown channels by default (defaults to off)', parameters: ['shown rooms defaulted'] },
    ];
    this.regex = new RegExp(`^${this.call}\\s?(on|off)?$`, 'i');
    this.requiresAuth = true;
    this.allowDM = false;
  }

  /**
   * Run the command
   * @param {Message} message Message with a command to handle, reply to,
   *                          or perform an action based on parameters.
   * @param {Object} ctx Command context for calling commands
   * @returns {string} success status
   */
  async run(message, ctx) {
    let enable = message.strippedContent.match(this.regex)[1];
    if (!enable) {
      return this.sendToggleUsage(message);
    }
    enable = enable.trim();
    await this.settings.setGuildSetting(message.guild, 'defaultShown', enable !== 'on');
    this.messageManager.notifySettingsChange(message, true, true);
    return this.messageManager.statuses.SUCCESS;
  }
}

module.exports = RoomShownDefault;
