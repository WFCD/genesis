'use strict';

const Command = require('../../models/Command.js');

class DeleteExpired extends Command {
  constructor(bot) {
    super(bot, 'settings.deleteexpired', 'delete expired', 'Set whether or not to delete expired notifications.', 'CORE');
    this.usages = [
      { description: 'Change if the bot to deletes expired notifications', parameters: ['deleting enabled'] },
    ];
    this.regex = new RegExp('^delete\\s?expired\\s?(on|off)?$', 'i');
    this.requiresAuth = true;
    this.allowDM = false;
  }

  async run(message, ctx) {
    let enable = message.strippedContent.match(this.regex)[1];
    if (!enable) {
      return this.sendToggleUsage(message, ctx);
    }
    enable = enable.trim();
    let enableResponse = false;
    if (enable === 'on') {
      enableResponse = true;
    }
    await this.settings.setGuildSetting(message.guild, 'deleteExpired', enableResponse);
    this.messageManager.notifySettingsChange(message, true, true);
    return this.messageManager.statuses.SUCCESS;
  }
}

module.exports = DeleteExpired;
