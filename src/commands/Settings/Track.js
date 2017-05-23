'use strict';

const Promise = require('bluebird');

const Command = require('../../Command.js');
const trackFunctions =  require('../../TrackFunctions.js');

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
    this.regex = new RegExp(`^${this.call}(?:\\s+(${eventTypes.join('|')}|${rewardTypes.join('|')}|all|events|items|fissures|syndicates|conclave)*)?`, 'i');
    this.requiresAuth = true;
  }

  /**
   * Run the command
   * @param {Message} message Message with a command to handle, reply to,
   *                          or perform an action based on parameters.
   */
  run(message) {
    const unsplitItems = message.strippedContent.replace(`${this.call} `, '');
    if (!unsplitItems) {
      this.bot.settings.getChannelPrefix(message.channel)
        .then(prefix => this.messageManager
              .embed(message, trackFunctions.getTrackInstructionEmbed(message, prefix, this.call), true, true))
        .catch(this.logger.error);
      return;
    }
    const trackables = trackFunctions.trackablesFromParameters(unsplitItems);
    if (!(trackables.events.length || trackables.items.length)) {
      this.bot.settings.getChannelPrefix(message.channel)
        .then(prefix => this.messageManager
              .embed(message, trackFunctions.getTrackInstructionEmbed(message, prefix, this.call), true, true))
        .catch(this.logger.error);
    } else {
      const promises = [];
      trackFunctions.events = trackFunctions.events.filter((elem, pos) => trackFunctions.events.indexOf(elem) === pos);
      trackFunctions.items = trackFunctions.items.filter((elem, pos) => trackFunctions.items.indexOf(elem) === pos);
      trackFunctions.events.forEach(event => promises.push(this.bot.settings
        .trackEventType(message.channel, event)));
      trackFunctions.items.forEach(item => promises.push(this.bot.settings
        .trackItem(message.channel, item)));
      
      Promise.each(promises, () => {})
        .then(() => this.messageManager.notifySettingsChange(message, true, true))
        .catch(this.logger.error);
    }
  }
}

module.exports = Track;
