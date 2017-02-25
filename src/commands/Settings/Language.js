'use strict';

const Command = require('../../Command.js');

class Language extends Command {
  constructor(bot) {
    super(bot, 'settings.language', 'language');
    this.usages = [
      { description: 'Change this channel\'s language', parameters: ['language'] },
    ];
    this.regex = new RegExp(`^${this.call}\\s?(.+)?$`, 'i');
  }

  run(message) {
    const language = message.strippedContent.match(this.regex)[1];
    if (!language || !this.bot.languages.includes(language.toLowerCase())) {
      message.channel.sendEmbed({
        title: 'Usage',
        type: 'rich',
        color: 0x0000ff,
        fields: [
          {
            name: `${this.bot.prefix}${this.call} <language>`,
            value: `Language is one of ${this.bot.languages.join(', ')}`,
          },
        ],
      });
    } else {
      this.bot.settings.setChannelLanguage(message.channel, language.toLowerCase()).then(() => {
        message.react('\u2705');
        this.bot.settings.getChannelResponseToSettings(message.channel)
          .then((respondToSettings) => {
            let retPromise = null;
            if (respondToSettings) {
              retPromise = message.reply('Settings updated');
            }
            return retPromise;
          });
      }).catch(this.logger.error);
    }
    if (message.deletable) {
      message.delete(5000).catch(this.logger.error);
    }
  }
}

module.exports = Language;
