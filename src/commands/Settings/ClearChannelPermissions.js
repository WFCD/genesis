'use strict';

const Command = require('../../Command.js');

class ClearChannelPermissions extends Command {
  constructor(bot) {
    super(bot, 'settings.clearChannelPerms', 'clear permissions', 'Clear channel permisions for this or specified room, or guild');
    this.regex = new RegExp(`^${this.call}(?:\\s*((?:(?:<#)?\\d+(?:>)?)|current|all|guild))?$`, 'i');
    this.requiresAuth = true;
    this.allowDM = false;
  }

  async run(message) {
    const channelParam = message.strippedContent.match(this.regex)[1] || 'current';
    const channels = this.getChannels(channelParam.trim(), message);
    if (channels.length) {
      const results = [];
      for (const channel of channels) {
        results.push(this.bot.settings.removeChannelPermissions(channel.id));
      }
      await Promise.all(results);
    } else {
      await this.bot.settings.removeGuildPermissions(message.guild);
    }
    this.messageManager.notifySettingsChange(message, true, true);
    return this.messageManager.statuses.SUCCESS;
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
