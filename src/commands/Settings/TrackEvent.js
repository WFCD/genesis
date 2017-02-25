'use strict';

const Command = require('../../Command.js');
const eventTypes = require('../../resources/trackables.json').eventTypes;

/**
 * Sets the current guild's custom prefix
 */
class TrackEvent extends Command {
  constructor(bot) {
    super(bot, 'settings.track.event', 'track event');
    this.usages = [
      { description: 'Show tracking command for tracking events', parameters: [] },
      { description: 'Track an event or events', parameters: ['event(s) to track'] },
    ];
    this.regex = new RegExp(`^${this.call}s?(?:\\s+(${eventTypes.join('|')}|all))?`, 'i');
  }

  /**
   * Run the command
   * @param {Message} message Message with a command to handle, reply to,
   *                          or perform an action based on parameters.
   */
  run(message) {
    const unsplitItems = message.strippedContent.match(this.regex)[1];
    if (!unsplitItems) {
      this.sendInstructionEmbed(message);
      return;
    }

    const items = unsplitItems.split(' ');
    let itemsToTrack = [];
    if (items[0] === 'all') {
      itemsToTrack = itemsToTrack.concat(eventTypes);
    } else {
      items.forEach((item) => {
        if (eventTypes.includes(item.trim())) {
          itemsToTrack.push(item.trim());
        } else {
          this.sendInstructionEmbed(message);
        }
      });
    }

    const promises = [];
    itemsToTrack.forEach(item => promises.push(this.bot.settings
      .trackEventType(message.channel, item)));

    promises.forEach(promise => promise.catch(this.logger.error));
    message.react('\u2705');
    this.bot.settings.getChannelResponseToSettings(message.channel)
      .then((respondToSettings) => {
        let retPromise = null;
        if (respondToSettings) {
          retPromise = message.reply('Settings updated').then((settingsMsg) => {
            if (settingsMsg.deletable) {
              settingsMsg.delete(50000).catch(this.logger.error);
            }
          });
        }
        return retPromise;
      }).catch(this.logger.error);
    if (message.deletable) {
      message.delete(5000).catch(this.logger.error);
    }
  }

  sendInstructionEmbed(message) {
    this.bot.settings.getChannelPrefix(message.channel)
      .then(prefix => message.channel.sendEmbed({
        title: 'Usage',
        type: 'rich',
        color: 0x0000ff,
        fields: [
          {
            name: `${prefix}${this.call} <event to track>`,
            value: 'Track events to be alerted in this channel.',
          },
          {
            name: 'Possible values:',
            value: `\n${eventTypes.join('\n')}`,
          },
        ],
      }))
      .catch(this.logger.error);
  }
}

module.exports = TrackEvent;
