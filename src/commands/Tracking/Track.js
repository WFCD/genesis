'use strict';

const Command = require('../../models/Command.js');
const {
  getEventsOrItems,
  trackablesFromParameters,
  getChannel,
  getTrackInstructionEmbed,
  trackablesCapture,
} = require('../../CommonFunctions');

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
    this.regex = new RegExp(`^${this.call}(?:\\s+(${trackablesCapture})*)?(?:\\s+in\\s+((?:\\<\\#)?\\d+(?:\\>)?|here))?`, 'i');
    this.requiresAuth = true;
  }

  async run(message) {
    const unsplitItems = getEventsOrItems(message);
    const roomId = new RegExp('(?:\\<\\#)?\\d{15,}(?:\\>)?|here', 'ig');

    if (unsplitItems.length === 0) {
      return this.failure(message);
    }
    this.logger.debug(`unsplit items: ${JSON.stringify(unsplitItems)}`);
    const trackables = trackablesFromParameters(unsplitItems);
    this.logger.debug(`resolved trackables: ${JSON.stringify(trackables)}`);
    if (!(trackables.events.length || trackables.items.length)) {
      return this.failure(message);
    }
    trackables.events = trackables.events
      .filter((elem, pos) => trackables.events.indexOf(elem) === pos);
    trackables.items = trackables.items
      .filter((elem, pos) => trackables.items.indexOf(elem) === pos);

    const channelParam = message.strippedContent.match(roomId) ? message.strippedContent.match(roomId)[0].trim().replace(/<|>|#/ig, '') : undefined;
    const channel = getChannel(channelParam, message);
    const results = [];
    if (trackables.events.length) {
      results.push(this.settings.trackEventTypes(channel, trackables.events));
    }
    if (trackables.items.length) {
      results.push(this.settings.trackItems(channel, trackables.items));
    }
    Promise.all(results);
    this.messageManager.notifySettingsChange(message, true, true);
    return this.messageManager.statuses.SUCCESS;
  }

  async failure(message) {
    const prefix = await this.settings.getGuildSetting(message.guild, 'prefix');
    this.messageManager.embed(
      message,
      getTrackInstructionEmbed(message, prefix, this.call), true, true,
    );
    return this.messageManager.statuses.FAILURE;
  }
}

module.exports = Track;
