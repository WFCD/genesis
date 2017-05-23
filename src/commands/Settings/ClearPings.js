'use strict';

const Command = require('../../Command.js');

class ClearPings extends Command {
  constructor(bot) {
    super(bot, 'settings.clearpings', 'clear pings', 'Clears all pings for the server');
    this.requiresAuth = true;
  }

  run(message) {
    this.bot.settings.clearPingsForGuild(message.guild).then(() => {
      this.messageManager.notifySettingsChange(message, true, true);
    }).catch(this.logger.error);
  }
}

module.exports = ClearPings;
