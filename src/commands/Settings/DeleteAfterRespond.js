'use strict';

const Command = require('../../Command.js');

class RespondToSettings extends Command {
  constructor(bot) {
    super(bot, 'settings.deleteafterrespond', 'delete after respond', 'Set whether or not to allow the bot to delete commands and/or responses after responding.');
    this.usages = [
      { description: 'Change if the bot to delete commands and/or responses after responding in this channel', parameters: ['deleting enabled'] },
    ];
    this.regex = new RegExp('^delete\\s?after\\s?respond\\s?(all|command|respond|none)?(?:\\s+in\\s+((?:\\<\\#)?\\d+(?:\\>)?|here))?$', 'i');
    this.requiresAuth = true;
    this.allowDM = false;
  }

  run(message) {
    let option = message.strippedContent.match(this.regex)[1];
    const usageEmbed = {
      title: 'Usage',
      type: 'rich',
      color: 0x779ECB,
      fields: [
        {
          name: '_ _',
          value: `${this.bot.prefix}${this.call} < all | command | respond | none > `,
        },
      ],
    };
    if (!option) {
      this.messageManager.embed(message, usageEmbed, true, true);
    } else {
      option = option.trim();
      let delCall = false;
      let delResponse = false;
      let doNothing = false;
      switch (option) {
        case 'all':
          delCall = true;
          delResponse = true;
          break;
        case 'command':
          delCall = true;
          delResponse = false;
          break;
        case 'respond':
          delCall = false;
          delResponse = true;
          break;
        case 'none':
          delCall = false;
          delResponse = false;
          break;
        default:
          doNothing = true;
          break;
      }

      if (!doNothing) {
        const dirtyChannelParam = message.strippedContent.match(this.regex)[2];
        const channelParam = dirtyChannelParam ? dirtyChannelParam.trim().replace(/<|>|#/ig, '') : undefined;
        const channel = this.getChannel(channelParam, message);
        this.bot.settings.setChannelDeleteAfterResponse(channel, delCall)
          .then(() => this.bot.settings.setChannelSetting(channel, 'delete_response', delResponse))
          .then(() => this.messageManager.notifySettingsChange(message, true, true))
          .catch(this.logger.error);
      } else {
        this.messageManager.embed(message, usageEmbed, true, true);
      }
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
