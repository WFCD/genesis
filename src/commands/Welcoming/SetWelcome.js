'use strict';

const Command = require('../../models/Command.js');

class SetWelcome extends Command {
  constructor(bot) {
    super(bot, 'settings.setwelcome', 'set welcome message', 'Set welcome message for this server in this channe', 'UTIL');
    this.usages = [
      { description: 'Set welcome message for this server in this channel', parameters: ['message'] },
    ];
    this.regex = new RegExp(`^${this.call}\\s?((.+|\\n)+)?$`, 'i');
    this.requiresAuth = true;
    this.allowDM = false;
  }

  async run(message) {
    const match = message.strippedContent.match(this.regex)[1];
    if (match) {
      await this.settings.setWelcome(message, false, match.trim());
      this.messageManager.notifySettingsChange(message, true, true);
      return this.constructor.statuses.SUCCESS;
    }
    return this.constructor.statuses.FAILURE;
  }
}

module.exports = SetWelcome;
