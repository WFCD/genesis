'use strict';

const Command = require('../../models/Command.js');

class ClearPings extends Command {
  constructor(bot) {
    super(bot, 'settings.clearpings', 'clear pings', 'Clears all pings for the server', 'CMD_MGMT');
    this.requiresAuth = true;
    this.allowDM = false;
  }

  async run(message) {
    await this.settings.removePings(message.guild.id);
    this.messageManager.notifySettingsChange(message, true, true);
    return this.constructor.statuses.SUCCESS;
  }
}

module.exports = ClearPings;
