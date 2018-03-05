'use strict';

const Command = require('../../Command.js');
const CommonFunctions = require('../../CommonFunctions.js');
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
    this.regex = new RegExp(`^${this.call}\\s*(cetus\\.day\\.[0-1]?[0-9]?[0-9]?|cetus\\.night\\.[0-1]?[0-9]?[0-9]?|${eventTypes.join('|')}|${rewardTypes.join('|')}|${opts.join('|')})*(?:\\s+in\\s+)?((?:\\<\\#)?\\d+(?:\\>)?|here)?`, 'i');
    this.requiresAuth = true;
  }

  async run(message) {
    const unsplitItems = CommonFunctions.getEventsOrItems(message);
    const roomId = new RegExp('(?:\\<\\#)?\\d{15,}(?:\\>)?|here', 'ig');

    if (unsplitItems.length === 0) {
      return this.failure(message);
    }
    const trackables = CommonFunctions.trackablesFromParameters(unsplitItems);
    if (!(trackables.events.length || trackables.items.length)) {
      return this.failure(message);
    }
    trackables.events = trackables.events
      .filter((elem, pos) => trackables.events.indexOf(elem) === pos);
    trackables.items = trackables.items
      .filter((elem, pos) => trackables.items.indexOf(elem) === pos);

    const channelParam = message.strippedContent.match(roomId) ? message.strippedContent.match(roomId)[0].trim().replace(/<|>|#/ig, '') : undefined;
    const channel = CommonFunctions.getChannel(channelParam, message, message.guild.channels);
    const results = [];
    if (trackables.events.length) {
      results.push(this.bot.settings.untrackEventTypes(channel, trackables.events));
    }
    if (trackables.items.length) {
      results.push(this.bot.settings.untrackItems(channel, trackables.items));
    }
    Promise.all(results);
    this.messageManager.notifySettingsChange(message, true, true);
    return this.messageManager.statuses.SUCCESS;
  }

  async failure(message) {
    const prefix = await this.bot.settings.getGuildSetting(message.guild, 'prefix');
    this.messageManager.embed(
      message,
      CommonFunctions.getTrackInstructionEmbed(message, prefix, this.call), true, true,
    );
    return this.messageManager.statuses.FAILURE;
  }
}

module.exports = Untrack;
