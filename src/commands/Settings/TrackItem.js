'use strict';

const Command = require('../../Command.js');
const rewardTypes = require('../../resources/trackables.json').rewardTypes;

/**
 * Sets the current guild's custom prefix
 */
class TrackItem extends Command {
  constructor(bot) {
    super(bot, 'settings.track.item', 'track item');
    this.usages = [
      { description: 'Show tracking command for tracking items', parameters: [] },
      { description: 'Track an item or items', parameters: ['item(s) to track'] },
    ];
    this.regex = new RegExp(`^${this.call}s?(?:\\s?(${rewardTypes.join('|')}|all))?`, 'i');
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
      itemsToTrack = itemsToTrack.concat(rewardTypes);
    } else {
      const invalidItems = [];
      items.forEach((item) => {
        if (rewardTypes.includes(item.trim())) {
          itemsToTrack.push(item.trim());
        } else {
          invalidItems.push(item.trim());
        }
        if (invalidItems.length > 0) {
          this.sendInstructionEmbed(message, invalidItems);
        }
      });
    }

    const promises = [];
    itemsToTrack.forEach(item => promises.push(this.bot.settings
      .trackItem(message.channel, item)));

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
            name: `${prefix}${this.call} <item to track>`,
            value: 'Track items to be alerted in this channel.',
          },
          {
            name: 'Possible values:',
            value: `\n${rewardTypes.join('\n')}`,
          },
        ],
      }))
      .catch(this.logger.error);
  }
}

module.exports = TrackItem;
