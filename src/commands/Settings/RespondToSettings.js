'use strict';

const Command = require('../../Command.js');

class RespondToSettings extends Command {
  constructor(bot) {
    super(bot, 'settings.respondSettings', 'Set whether or not to respond to settings');
    this.usages = [
      { description: 'Change if this channel has settings changes resonded in it', parameters: ['response enabled'] },
    ];
    this.regex = new RegExp('^respond?\\s?settings\\s?(.+)?$', 'i');
  }

  run(message) {
    const enable = message.strippedContent.match(this.regex)[1];
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
      let enableResponse = false;
      if (enable === 'enable' || enable === 'enable' || enable === '1' || enable === 'true') {
        enableResponse = true;
      }
      this.bot.settings.setChannelResponseToSettings(message.channel, enableResponse)
      .then(() => this.messageManager.notifySettingsChange(message, true, true))
      .catch(this.logger.error);
    }
  }
}

module.exports = RespondToSettings;
