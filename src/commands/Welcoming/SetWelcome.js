'use strict';

const Command = require('../../Command.js');

class SetWelcome extends Command {
  constructor(bot) {
    super(bot, 'settings.setwelcome', 'set welcome message');
    this.usages = [
      { description: 'Set welcome message for this server in this channel', parameters: ['message'] },
    ];
    this.regex = new RegExp(`^${this.call}\\s+?(.+)?$`, 'i');
    this.requiresAuth = true;
    this.allowDM = false;
  }

  run(message) {
    const match = message.strippedContent.match(this.regex)[1];
    if (match) {
      this.bot.settings.setWelcome(message, false, match.trim())
        .then(() => this.messageManager.notifySettingsChange(message, true, true))
        .catch(this.logger.error);
    }
  }
}

module.exports = SetWelcome;
