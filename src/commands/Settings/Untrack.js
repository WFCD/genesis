'use strict';

const Command = require('../../Command.js');
const eventTypes = require('../../resources/trackables.json').eventTypes;
const rewardTypes = require('../../resources/trackables.json').rewardTypes;

/**
 * Sets the current guild's custom prefix
 */
class Untrack extends Command {
  constructor(bot) {
    super(bot, 'settings.untrack', 'untrack');
    this.usages = [
      { description: 'Show tracking command for tracking events', parameters: [] },
      { description: 'Track an event or events', parameters: ['event(s) to track'] },
    ];
    this.regex = new RegExp(`^${this.call}(?:(${eventTypes.join('|')}|${rewardTypes.join('|')}|all|events|items)*)?`, 'i');
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
      this.sendInstructionEmbed(message);
      return;
    }

    const items = unsplitItems.split(' ');
    let itemsToTrack = [];
    let eventsToTrack = [];
    let saveTrack = true;
    if (items[0] === 'all') {
      eventsToTrack = itemsToTrack.concat(eventTypes);
      itemsToTrack = itemsToTrack.concat(rewardTypes);
    } else if (items[0] === 'events') {
      eventsToTrack = eventsToTrack.concat(eventTypes);
    } else if (items[0] === 'items') {
      itemsToTrack = itemsToTrack.concat(rewardTypes);
    } else {
      items.forEach((item) => {
        if (rewardTypes.includes(item.trim()) && saveTrack) {
          itemsToTrack.push(item.trim());
        } else if (eventTypes.includes(item.trim()) && saveTrack) {
          eventsToTrack.push(item.trim());
        } else if ((eventsToTrack.length === 0 || itemsToTrack.length === 0) && saveTrack) {
          this.sendInstructionEmbed(message);
          saveTrack = false;
        }
      });
    }

    const promises = [];
    if (saveTrack) {
      eventsToTrack.forEach(event => this.bot.settings
        .untrackEventType(message.channel, event).catch(this.logger.error));
      itemsToTrack.forEach(item => this.bot.settings
        .untrackItem(message.channel, item).catch(this.logger.error));
      this.messageManager.notifySettingsChange(message, true, true);
    }

    promises.forEach(promise => promise.catch(this.logger.error));
  }

  sendInstructionEmbed(message) {
    this.bot.settings.getChannelPrefix(message.channel)
      .then(prefix => this.messageManager.embed(message, {
        title: 'Usage',
        type: 'rich',
        color: 0x0000ff,
        fields: [
          {
            value: 'Untrack events/items to be alerted in this channel.',
            name: `${prefix}${this.call} <event(s)/item(s) to untrack>`,
          },
          {
            name: 'Possible values:',
            value: '_ _',
          },
          {
            name: '**Events:**',
            value: eventTypes.join('\n'),
            inline: true,
          },
          {
            name: '**Rewards:**',
            value: rewardTypes.join('\n'),
            inline: true,
          },
        ],
      }, true, false));
  }
}

module.exports = Untrack;
