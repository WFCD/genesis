'use strict';

const Command = require('../../Command.js');

class Language extends Command {
  constructor(bot) {
    super(bot, 'settings.language', 'language');
    this.usages = [
      { description: 'Change this channel\'s language', parameters: ['language'] },
    ];
    this.regex = new RegExp(`^${this.call}\\s?(.+)?$`, 'i');
    this.requiresAuth = true;
  }

  run(message) {
    const language = message.strippedContent.match(this.regex)[1];
    if (!language || !this.bot.languages.includes(language.toLowerCase())) {
      const embed = {
        title: 'Usage',
        type: 'rich',
        color: 0x0000ff,
        fields: [
          {
            name: `${this.bot.prefix}${this.call} <language>`,
            value: `Language is one of ${this.bot.languages.join(', ')}`,
          },
        ],
      };
      this.messageManager.embed(message, embed, true, true);
    } else {
      this.bot.settings.setChannelLanguage(message.channel, language.toLowerCase()).then(() => {
        this.messageManager.notifySettingsChange(message, true, true);
      }).catch(this.logger.error);
    }
  }
}

module.exports = Language;
