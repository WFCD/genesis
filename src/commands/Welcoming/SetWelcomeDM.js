'use strict';

const Command = require('../../Command.js');

class SetWelcomeDM extends Command {
  constructor(bot) {
    super(bot, 'settings.setwelcome', 'set welcome dm');
    this.usages = [
      { description: 'Set welcome message for this server in this channel to send to a user in DM', parameters: ['message'] },
    ];
    this.regex = new RegExp(`^${this.call}\\s+?(.+)?$`, 'i');
    this.requiresAuth = true;
    this.allowDM = false;
  }

  run(message) {
    const match = message.strippedContent.match(this.regex)[1];
    if (match) {
      this.bot.settings.setWelcome(message, true, match.trim())
        .then(() => this.messageManager.notifySettingsChange(message, true, true))
        .catch(this.logger.error);
    }
  }
}

module.exports = SetWelcomeDM;
