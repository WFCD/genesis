'use strict';

const Command = require('../../Command.js');

class ClearWelcome extends Command {
  constructor(bot) {
    super(bot, 'settings.clearwelcomemessage', 'clear welcome message', 'Clears all pings for the server');
    this.requiresAuth = true;
    this.allowDM = false;
  }

  run(message) {
    this.bot.settings.clearWelcomeForGuild(message.guild, false).then(() => {
      this.messageManager.notifySettingsChange(message, true, true);
    }).catch(this.logger.error);
  }
}

module.exports = ClearWelcome;
