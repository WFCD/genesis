'use strict';

const Command = require('../../Command.js');
const trackFunctions = require('../../TrackFunctions.js');

const eventTypes = require('../../resources/trackables.json').eventTypes;
const rewardTypes = require('../../resources/trackables.json').rewardTypes;

/**
 * Track an event or item
 */
class Track extends Command {
  constructor(bot) {
    super(bot, 'settings.track', 'track');
    this.usages = [
      { description: 'Show tracking command for tracking events', parameters: [] },
      { description: 'Track an event or events', parameters: ['event(s) to track'] },
    ];
    this.regex = new RegExp(`^${this.call}(?:\\s+(${eventTypes.join('|')}|${rewardTypes.join('|')}|all|events|items|fissures|syndicates|conclave|clantech|deals)*)?(?:\\s+in\\s+((?:\\<\\#)?\\d+(?:\\>)?|here))?`, 'i');
    this.requiresAuth = true;
  }

  async run(message) {
    const eventsOrItems = new RegExp(`${eventTypes.join('|')}|${rewardTypes.join('|')}|all|events|items|fissures|syndicates|conclave|clantech|deals`, 'ig');
    const roomId = new RegExp('(?:\\<\\#)?\\d+(?:\\>)?|here', 'ig');

    const unsplitItems = message.strippedContent.match(eventsOrItems) ? message.strippedContent.match(eventsOrItems).join(' ') : undefined;
    if (!unsplitItems) {
      const prefix = await this.bot.settings.getChannelPrefix(message.channel);
      this.messageManager.embed(message,
        trackFunctions.getTrackInstructionEmbed(message, prefix, this.call), true, true);
      return this.messageManager.statuses.FAILURE;
    }
    const trackables = trackFunctions.trackablesFromParameters(unsplitItems);
    if (!(trackables.events.length || trackables.items.length)) {
      const prefix = await this.bot.settings.getChannelPrefix(message.channel);
      this.messageManager.embed(message,
        trackFunctions.getTrackInstructionEmbed(message, prefix, this.call), true, true);
      return this.messageManager.statuses.FAILURE;
    }
    trackables.events = trackables.events
        .filter((elem, pos) => trackables.events.indexOf(elem) === pos);
    trackables.items = trackables.items
        .filter((elem, pos) => trackables.items.indexOf(elem) === pos);

    const channelParam = message.strippedContent.match(roomId) ? message.strippedContent.match(roomId)[0].trim().replace(/<|>|#/ig, '') : undefined;
    const channel = this.getChannel(channelParam, message);
    for (const event of trackables.events) {
      await this.bot.settings.trackEventType(channel, event);
    }
    for (const item of trackables.items) {
      await this.bot.settings.trackItem(channel, item);
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

module.exports = Track;
