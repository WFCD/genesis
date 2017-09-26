'use strict';

const Command = require('../../Command.js');
const trackFunctions = require('../../TrackFunctions.js');
const allTrackables = require('../../resources/trackables.json');

const eventTypes = allTrackables.eventTypes;
const rewardTypes = allTrackables.rewardTypes;

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
    this.regex = new RegExp(`^${this.call}(?:\\s+(${eventTypes.join('|')}|${rewardTypes.join('|')}|all|events|items|fissures|syndicates|conclave|clantech|deals|resources)*)?(?:\\s+in\\s+((?:\\<\\#)?\\d+(?:\\>)?|here))?`, 'i');
    this.requiresAuth = true;
  }

  async run(message) {
    const eventsOrItems = new RegExp(`${eventTypes.join('|')}|${rewardTypes.join('|')}|all|events|items|fissures|syndicates|conclave|clantech|deals|resources`, 'ig');
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
      results.push(this.bot.settings.trackEventType(channel, event));
    }
    for (const item of trackables.items) {
      results.push(this.bot.settings.trackItem(channel, item));
    }
    Promise.all(results);
    this.messageManager.notifySettingsChange(message, true, true);
    return this.messageManager.statuses.SUCCESS;
  }

  async failure(message) {
    const prefix = await this.bot.settings.getChannelSetting(message.channel, 'prefix');
    this.messageManager.embed(message,
      trackFunctions.getTrackInstructionEmbed(message, prefix, this.call), true, true);
    return this.messageManager.statuses.FAILURE;
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
