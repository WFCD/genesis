'use strict';

const Promise = require('bluebird');

const Command = require('../../Command.js');
const trackFunctions = require('../../TrackFunctions.js');

const eventTypes = require('../../resources/trackables.json').eventTypes;
const rewardTypes = require('../../resources/trackables.json').rewardTypes;

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
    this.regex = new RegExp(`^${this.call}\\s*(${eventTypes.join('|')}|${rewardTypes.join('|')}|all|events|items|fissures|syndicates|conclave|clantech|deals)*(?:\\s+in\\s+)?((?:\\<\\#)?\\d+(?:\\>)?|here)?`, 'i');
    this.requiresAuth = true;
  }

  /**
   * Run the command
   * @param {Message} message Message with a command to handle, reply to,
   *                          or perform an action based on parameters.
   */
  run(message) {
    const eventsOrItems = new RegExp(`${eventTypes.join('|')}|${rewardTypes.join('|')}|all|events|items|fissures|syndicates|conclave|clantech|deals`, 'ig');
    const roomId = new RegExp('(?:\\<\\#)?\\d+(?:\\>)?|here', 'ig');

    const unsplitItems = message.strippedContent.match(eventsOrItems) ? message.strippedContent.match(eventsOrItems).join(' ') : undefined;
    if (!unsplitItems) {
      this.bot.settings.getChannelPrefix(message.channel)
        .then(prefix => this.messageManager
              .embed(message, trackFunctions
                .getTrackInstructionEmbed(message, prefix, this.call), true, true))
        .catch(this.logger.error);
      return;
    }
    const trackables = trackFunctions.trackablesFromParameters(unsplitItems);
    if (!(trackables.events.length || trackables.items.length)) {
      this.bot.settings.getChannelPrefix(message.channel)
        .then(prefix => this.messageManager
              .embed(message, trackFunctions
                .getTrackInstructionEmbed(message, prefix, this.call), true, true))
        .catch(this.logger.error);
    } else {
      const promises = [];
      trackables.events = trackables.events
        .filter((elem, pos) => trackables.events.indexOf(elem) === pos);
      trackables.items = trackables.items
        .filter((elem, pos) => trackables.items.indexOf(elem) === pos);

      const channelParam = message.strippedContent.match(roomId) ? message.strippedContent.match(roomId)[0].trim().replace(/<|>|#/ig, '') : undefined;
      const channel = this.getChannel(channelParam, message);

      trackables.events.forEach(event => promises.push(this.bot.settings
        .untrackEventType(channel, event)));
      trackables.items.forEach(item => promises.push(this.bot.settings
        .untrackItem(channel, item)));

      Promise.each(promises, () => {})
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

module.exports = Untrack;
