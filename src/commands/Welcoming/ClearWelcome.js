'use strict';

const Command = require('../../Command.js');

class ClearWelcome extends Command {
  constructor(bot) {
    super(bot, 'settings.clearwelcomemessage', 'clear welcome message', 'Clears all pings for the server');
    this.requiresAuth = true;
    this.allowDM = false;
  }

  async run(message) {
    await this.bot.settings.clearWelcomeForGuild(message.guild, false);
    this.messageManager.notifySettingsChange(message, true, true);
    return this.messageManager.statuses.SUCCESS;
  }
}

module.exports = ClearWelcome;
