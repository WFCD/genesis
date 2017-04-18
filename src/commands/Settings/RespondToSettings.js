'use strict';

const Command = require('../../Command.js');

class RespondToSettings extends Command {
  constructor(bot) {
    super(bot, 'settings.respondSettings', 'respond yo settings', 'Set whether or not to respond to settings');
    this.usages = [
      { description: 'Change if this channel has settings changes resonded in it', parameters: ['response enabled'] },
    ];
    this.regex = new RegExp('^respond(?:\\sto)?\\s?settings\\s?(.+)?$', 'i');
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
      if (enable === 'enable' || enable === 'enable' || enable === '1' || enable === 'true' || enable === 1) {
        enableResponse = true;
      }
      this.bot.settings.setChannelResponseToSettings(message.channel, enableResponse)
        .then(() => this.messageManager.notifySettingsChange(message, true, true))
        .catch(this.logger.error);
    }
  }
}

module.exports = RespondToSettings;
