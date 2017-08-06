'use strict';

const Command = require('../../Command.js');

class ClearWelcomeDM extends Command {
  constructor(bot) {
    super(bot, 'settings.clearwelcomedm', 'clear welcome dm', 'Clears all pings for the server');
    this.requiresAuth = true;
    this.allowDM = false;
  }

  run(message) {
    this.bot.settings.clearWelcomeForGuild(message.guild, true).then(() => {
      this.messageManager.notifySettingsChange(message, true, true);
    }).catch(this.logger.error);
  }
}

module.exports = ClearWelcomeDM;
