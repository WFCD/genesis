'use strict';

const Command = require('../../Command.js');
const EventEmbed = require('../../embeds/EventEmbed.js');

/**
 * Displays the current event statuses
 */
class Event extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'warframe.worldstate.events', 'events', 'Display current events.');
    this.regex = new RegExp(`^${this.call}(?:\\s+on\\s+([pcsxb14]{2,3}))?$`, 'i');
  }

  async run(message) {
    const platformParam = message.strippedContent.match(this.regex)[1];
    const platform = (platformParam || await this.bot.settings
      .getChannelSetting(message.channel, 'platform')).toLowerCase();
    const ws = await this.bot.caches[platform.toLowerCase()].getDataJson();
    if (ws.events.length > 0) {
      const results = [];
      ws.events.forEach((event) => {
        results.push(this.messageManager.embed(message,
          new EventEmbed(this.bot, event, platform.toUpperCase()), true, true));
      });
      await Promise.all(results);
      return this.messageManager.statuses.SUCCESS;
    }
    await this.messageManager.embed(message, new EventEmbed(this.bot,
      undefined, platform.toUpperCase()), true, true);
    return this.messageManager.statuses.FAILURE;
  }
}

module.exports = Event;
