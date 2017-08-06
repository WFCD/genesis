'use strict';

const Promise = require('bluebird');

const Command = require('../../Command.js');

class ClearChannelPermissions extends Command {
  constructor(bot) {
    super(bot, 'settings.clearChannelPerms', 'clear permissions', 'Clear channel permisions for this or specified room, or guild');
    this.regex = new RegExp(`^${this.call}(?:\\s*((?:(?:<#)?\\d+(?:>)?)|current|all|guild))?$`, 'i');
    this.requiresAuth = true;
    this.allowDM = false;
  }

  run(message) {
    const channelParam = message.strippedContent.match(this.regex)[1] || 'current';
    const channels = this.getChannels(channelParam.trim(), message);
    if (channels.length) {
      Promise.each(channels, (channel) => {
        this.bot.settings.deleteChannelPermissions(channel);
      })
      .then(() => this.messageManager.notifySettingsChange(message, true, true))
      .catch(this.logger.error);
    } else {
      this.bot.settings.deleteGuildPermissions(message.guild)
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
  getChannels(channelsParam, message) {
    let channels = [];
    // handle it for strings
    if (channelsParam !== 'all' && channelsParam !== 'current') {
      channels.push(this.bot.client.channels.get(channelsParam.trim().replace(/(<|>|#)/ig, '')));
    } else if (channelsParam === 'all') {
      channels = channels.concat(message.guild.channels.array().filter(channel => channel.type === 'text'));
    } else if (channelsParam === 'current') {
      channels.push(message.channel);
    }
    return channels;
  }
}

module.exports = ClearChannelPermissions;
