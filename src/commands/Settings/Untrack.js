'use strict';

const Command = require('../../Command.js');
const trackFunctions = require('../../TrackFunctions.js');

const { eventTypes, rewardTypes, opts } = require('../../resources/trackables.json');

/**
 * Untrack an event or item
 */
class Untrack extends Command {
  constructor(bot) {
    super(bot, 'settings.untrack', 'untrack');
    this.usages = [
      { description: 'Show tracking command for tracking events', parameters: [] },
      { description: 'Track an event or events', parameters: ['event(s) to track'] },
    ];
    this.regex = new RegExp(`^${this.call}\\s*(${eventTypes.join('|')}|${rewardTypes.join('|')}|${opts.join('|')})*(?:\\s+in\\s+)?((?:\\<\\#)?\\d+(?:\\>)?|here)?`, 'i');
    this.requiresAuth = true;
  }

  async run(message) {
    const eventsOrItems = new RegExp(`${eventTypes.join('|')}|${rewardTypes.join('|')}|${opts.join('|')}`, 'ig');
    const roomId = new RegExp('(?:\\<\\#)?\\d{15,}(?:\\>)?|here', 'ig');

    const unsplitItems = message.strippedContent.match(eventsOrItems) ? message.strippedContent.match(eventsOrItems).join(' ') : undefined;
    if (!unsplitItems) {
      return this.failure(message);
    }
    const trackables = trackFunctions.trackablesFromParameters(unsplitItems);
    if (!(trackables.events.length || trackables.items.length)) {
      return this.failure(message);
    }
    trackables.events = trackables.events
      .filter((elem, pos) => trackables.events.indexOf(elem) === pos);
    trackables.items = trackables.items
      .filter((elem, pos) => trackables.items.indexOf(elem) === pos);

    const channelParam = message.strippedContent.match(roomId) ? message.strippedContent.match(roomId)[0].trim().replace(/<|>|#/ig, '') : undefined;
    const channel = this.getChannel(channelParam, message);

    const results = [];
    for (const event of trackables.events) {
      results.push(this.bot.settings.untrackEventType(channel, event));
    }
    for (const item of trackables.items) {
      results.push(this.bot.settings.untrackItem(channel, item));
    }
    Promise.all(results);
    this.messageManager.notifySettingsChange(message, true, true);
    return this.messageManager.statuses.SUCCESS;
  }

  async failure(message) {
    const prefix = await this.bot.settings.getGuildSetting(message.guild, 'prefix');
    this.messageManager.embed(
      message,
      trackFunctions.getTrackInstructionEmbed(message, prefix, this.call), true, true,
    );
    return this.messageManager.statuses.FAILURE;
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
