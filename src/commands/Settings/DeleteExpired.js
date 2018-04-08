'use strict';

const Command = require('../../models/Command.js');

class DeleteExpired extends Command {
  constructor(bot) {
    super(bot, 'settings.deleteexpired', 'delete expired', 'Set whether or not to delete expired notifications.');
    this.usages = [
      { description: 'Change if the bot to deletes expired notifications', parameters: ['deleting enabled'] },
    ];
    this.regex = new RegExp('^delete\\s?expired\\s?(on|off)?$', 'i');
    this.requiresAuth = true;
    this.allowDM = false;
  }

  async run(message) {
    let enable = message.strippedContent.match(this.regex)[1];
    if (!enable) {
      const embed = {
        title: 'Usage',
        type: 'rich',
        color: 0x0000ff,
        fields: [
          {
            name: `${this.bot.prefix}${this.call} <on|off>`,
            value: '_ _',
          },
        ],
      };
      this.messageManager.embed(message, embed, true, true);
      return this.messageManager.statuses.FAILURE;
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
