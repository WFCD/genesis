'use strict';

const Command = require('../../Command.js');
const eventTypes = require('../../resources/trackables.json').eventTypes;
const rewardTypes = require('../../resources/trackables.json').rewardTypes;

/**
 * Sets the current guild's custom prefix
 */
class Track extends Command {
  constructor(bot) {
    super(bot, 'settings.track', 'track');
    this.usages = [
      { description: 'Show tracking command for tracking events', parameters: [] },
      { description: 'Track an event or events', parameters: ['event(s) to track'] },
    ];
    this.regex = new RegExp(`^${this.call}(?:\\s+(${eventTypes.join('|')}|${rewardTypes.join('|')}|all|events|items)*)?`, 'i');
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
    if (items[0].toLowerCase() === 'all') {
      eventsToTrack = eventsToTrack.concat(eventTypes);
      itemsToTrack = itemsToTrack.concat(rewardTypes);
    } else {
      items.forEach((item) => {
        if (item.toLowerCase() === 'items') {
          itemsToTrack = itemsToTrack.concat(rewardTypes);
        } else if (item.toLowerCase() === 'events') {
          eventsToTrack = eventsToTrack.concat(eventTypes);
        } else if (rewardTypes.includes(item.trim()) && saveTrack) {
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
      eventsToTrack = eventsToTrack.filter((elem, pos) => eventsToTrack.indexOf(elem) === pos);
      itemsToTrack = itemsToTrack.filter((elem, pos) => itemsToTrack.indexOf(elem) === pos);
      eventsToTrack.forEach(event => promises.push(this.bot.settings
        .trackEventType(message.channel, event)));
      itemsToTrack.forEach(item => promises.push(this.bot.settings
        .trackItem(message.channel, item)));
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
            name: `${prefix}${this.call} <event(s)/item(s) to track>`,
            value: 'Track events/items to be alerted in this channel.',
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
      }, true, false))
      .catch(this.logger.error);
  }
}

module.exports = Track;
