'use strict';

const Command = require('../../Command.js');

class RespondToSettings extends Command {
  constructor(bot) {
    super(bot, 'settings.deleteafterrespond', 'delete after respond', 'Set whether or not to allow the bot to delete commands and/or responses after responding.');
    this.usages = [
      { description: 'Change if the bot to delete commands and/or responses after responding in this channel', parameters: ['deleting enabled'] },
    ];
    this.regex = new RegExp('^delete\\s?after\\s?respond\\s?(.+)?$', 'i');
    this.requiresAuth = true;
  }

  run(message) {
    let enable = message.strippedContent.match(this.regex)[1];
    if (!enable) {
      const embed = {
        title: 'Usage',
        type: 'rich',
        color: 0x0000ff,
        fields: [
          {
            name: `${this.bot.prefix}${this.call} <yes|no>`,
            value: '_ _',
          },
        ],
      };
      this.messageManager.embed(message, embed, true, true);
    } else {
      enable = enable.trim();
      let enableResponse = false;
      if (enable === 'enable' || enable === 'yes' || enable === '1' || enable === 'true' || enable === 1) {
        enableResponse = true;
      }
      this.bot.settings.setChannelDeleteAfterResponse(message.channel, enableResponse)
        .then(() => this.messageManager.notifySettingsChange(message, true, true))
        .catch(this.logger.error);
    }
  }
}

module.exports = RespondToSettings;
