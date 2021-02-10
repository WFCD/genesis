'use strict';

const Command = require('../../models/Command.js');
const { getChannel, captures } = require('../../CommonFunctions');

const languages = require('../../resources/locales').map(lang => lang.toLowerCase());

class Language extends Command {
  constructor(bot) {
    super(bot, 'settings.language', 'language', 'Set the channel\'s language', 'CORE');
    this.usages = [
      { description: 'Change this channel\'s language', parameters: languages, separator: '|'},
    ];
    this.regex = new RegExp(`^${this.call}\\s?(${languages.join('|')})?(?:\\s+in\\s+(${captures.channel}|here))?$`, 'i');
    this.requiresAuth = true;
  }

  async run(message, ctx) {
    const language = message.strippedContent.match(this.regex)[1];
    if (!language || !languages.includes(language.toLowerCase())) {
      return this.sendToggleUsage(message, ctx, languages);
    }
    const channelParam = message.strippedContent.match(this.regex)[2] ? message.strippedContent.match(this.regex)[2].trim().replace(/<|>|#/ig, '') : undefined;
    let m = '';
    languages.forEach((lang) => {
      if (language.toLowerCase() === lang.toLowerCase()) {
        m = lang;
      }
    });
    const channel = getChannel(channelParam, message);
    await this.settings.setChannelSetting(channel, 'language', m || language.toLowerCase());
    this.messageManager.notifySettingsChange(message, true, true);
    return this.messageManager.statuses.SUCCESS;
  }
}

module.exports = Language;
