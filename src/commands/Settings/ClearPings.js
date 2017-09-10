'use strict';

const Command = require('../../Command.js');

class ClearPings extends Command {
  constructor(bot) {
    super(bot, 'settings.clearpings', 'clear pings', 'Clears all pings for the server');
    this.requiresAuth = true;
    this.allowDM = false;
  }

  async run(message) {
    await this.bot.settings.clearPingsForGuild(message.guild);
    this.messageManager.notifySettingsChange(message, true, true);
    return this.messageManager.statuses.SUCCESS;
  }
}

module.exports = ClearPings;
