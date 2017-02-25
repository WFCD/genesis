'use strict';

const Command = require('../../Command.js');

/**
 * Sets the current guild's custom prefix
 */
class Prefix extends Command {
  constructor(bot) {
    super(bot, 'settings.prefix', 'prefix');
    this.usages = [
      { description: 'Change this channel\'s platform', parameters: ['prefix (up to 3 characters)'] },
    ];
    this.regex = new RegExp(`^${this.call}(?:\\s+(.+))?`,
      'i');
    this.requiresAuth = true;
  }

  /**
   * Run the command
   * @param {Message} message Message with a command to handle, reply to,
   *                          or perform an action based on parameters.
   */
  run(message) {
    const prefix = message.strippedContent.match(this.regex)[1];
    if (!prefix) {
      message.channel.sendEmbed({
        title: 'Usage',
        type: 'rich',
        color: 0x0000ff,
        fields: [
          {
            name: `${this.bot.prefix}${this.call} <prefix>`,
            value: 'Set the channel\'s custom prefix',
          },
        ],
      });
    } else if (prefix === 'reset') {
      let promise = null;
      if (message.channel.type === 'text') {
        promise = this.bot.settings.resetGuildPrefix(message.channel.guild);
      } else {
        promise = this.bot.settings.resetChannelPrefix(message.channel);
      }
      promise.then(() => {
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
    } else {
      let promise = null;
      if (message.channel.type === 'text') {
        promise = this.bot.settings.setGuildPrefix(message.channel.guild, prefix);
      } else {
        promise = this.bot.settings.setChannelPrefix(message.channel, prefix);
      }
      promise.then(() => {
        message.react('\u2705');
        this.bot.settings.getChannelResponseToSettings(message.channel)
            .then((respondToSettings) => {
              let retPromise = null;
              if (respondToSettings) {
                retPromise = message.reply('Settings updated').then((settingsMsg) => {
                  if (settingsMsg.deletable) {
                    settingsMsg.delete(50000).catch(this.logger.error);
                  }
                });
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

module.exports = Prefix;
