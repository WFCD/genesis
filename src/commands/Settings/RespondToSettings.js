'use strict';

const Command = require('../../Command.js');

class RespondToSettings extends Command {
  constructor(bot) {
    super(bot, 'settings.respondSettings', 'respond to settings', 'Toggle whether or not the bot tells you when settings change from your command.');
    this.usages = [
      { description: 'Change if this channel has settings changes resonded in it', parameters: ['response enabled'] },
    ];
    this.regex = new RegExp('^respond(?:\\sto)?\\s?settings\\s?(on|off)?(?:\\s+in\\s+((?:\\<\\#)?\\d+(?:\\>)?|here))?$', 'i');
    this.requiresAuth = true;
  }

  run(message) {
    let enable = message.strippedContent.match(this.regex)[1];
    const channelParam = message.strippedContent.match(this.regex)[2].trim().replace(/<|>|#/ig, '');
    const channel = this.getChannel(channelParam, message);
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
    } else {
      enable = enable.trim();
      let enableResponse = false;
      if (enable === 'on') {
        enableResponse = true;
      }
      this.bot.settings.setChannelResponseToSettings(channel, enableResponse)
        .then(() => this.messageManager.notifySettingsChange(message, true, true))
        .catch(this.logger.error);
    }
  }

  /**
   * Get the list of channels to enable commands in based on the parameters
   * @param {string|Array<Channel>} channelsParam parameter for determining channels
   * @param {Message} message Discord message to get information on channels
   * @returns {Array<string>} channel ids to enable commands in
   */
  getChannel(channelsParam, message) {
    let channel = message.channel;
    if (typeof channelsParam === 'string') {
      // handle it for strings
      if (channelsParam !== 'here') {
        channel = this.bot.client.channels.get(channelsParam.trim());
      } else if (channelsParam === 'here') {
        channel = message.channel;
      }
    }
    return channel;
  }
}

module.exports = RespondToSettings;
