'use strict';

const Command = require('../../Command.js');

/**
 * Untrack an event or item
 */
class Untrack extends Command {
  constructor(bot) {
    super(bot, 'settings.stop', 'stop');
    this.usages = [
      { description: 'Untracks everything in a channel, effectively stopping tracking for the channel', parameters: [] },
    ];
    this.regex = new RegExp(`^${this.call}\\s*(?:\\s+in\\s+)?((?:\\<\\#)?\\d+(?:\\>)?|here)?`, 'i');
    this.requiresAuth = true;
  }

  async run(message) {
    const roomId = new RegExp('(?:\\<\\#)?\\d{15,}(?:\\>)?|here', 'ig');
    const channelParam = message.strippedContent.match(roomId) ? message.strippedContent.match(roomId)[0].trim().replace(/<|>|#/ig, '') : undefined;
    const channel = this.getChannel(channelParam, message);

    this.bot.settings.removeTypeNotifications(channel.id);
    this.bot.settings.removeItemNotifications(channel.id);
    this.messageManager.notifySettingsChange(message, true, true);
    return this.messageManager.statuses.SUCCESS;
  }

  /**
   * Get the list of channels to enable commands in based on the parameters
   * @param {string|Array<Channel>} channelsParam parameter for determining channels
   * @param {Message} message Discord message to get information on channels
   * @returns {Array<string>} channel ids to enable commands in
   */
  getChannel(channelsParam, message) {
    let { channel } = message;
    if (typeof channelsParam === 'string') {
      // handle it for strings
      if (channelsParam !== 'here') {
        channel = this.bot.client.channels.get(channelsParam.trim());
      } else if (channelsParam === 'here') {
        // eslint-disable-next-line prefer-destructuring
        channel = message.channel;
      }
    }
    return channel;
  }
}

module.exports = Untrack;
