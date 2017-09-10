'use strict';

const Command = require('../../Command.js');

class ClearWelcomeDM extends Command {
  constructor(bot) {
    super(bot, 'settings.clearwelcomedm', 'clear welcome dm', 'Clears all pings for the server');
    this.requiresAuth = true;
    this.allowDM = false;
  }

  async run(message) {
    await this.bot.settings.clearWelcomeForGuild(message.guild, true);
    this.messageManager.notifySettingsChange(message, true, true);
    return this.messageManager.statuses.SUCCESS;
  }
}

module.exports = ClearWelcomeDM;
