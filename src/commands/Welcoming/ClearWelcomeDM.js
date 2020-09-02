'use strict';

const Command = require('../../models/Command.js');

class ClearWelcomeDM extends Command {
  constructor(bot) {
    super(bot, 'settings.clearwelcomedm', 'clear welcome dm', 'Clears all welcome direct messages for the server.', 'UTIL');
    this.requiresAuth = true;
    this.allowDM = false;
  }

  async run(message) {
    await this.settings.clearWelcomeForGuild(message.guild, true);
    this.messageManager.notifySettingsChange(message, true, true);
    return this.messageManager.statuses.SUCCESS;
  }
}

module.exports = ClearWelcomeDM;
