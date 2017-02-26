'use strict';

const Command = require('../../Command.js');
const rewardTypes = require('../../resources/trackables.json').rewardTypes;

/**
 * Sets the current guild's custom prefix
 */
class Prefix extends Command {
  constructor(bot) {
    super(bot, 'settings.untrack.item', 'untrack item');
    this.usages = [
      { description: 'Unrack an item or items', parameters: ['item to untrack'] },
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
      .untrackItem(message.channel, item)));
    promises.forEach(promise => promise.catch(this.logger.error));
    this.messageManager.notifySettingsChange(message, true, true);
  }

  sendInstructionEmbed(message) {
    this.bot.settings.getChannelPrefix(message.channel)
      .then(prefix => message.channel.sendEmbed({
        title: 'Usage',
        type: 'rich',
        color: 0x0000ff,
        fields: [
          {
            name: `${prefix}${this.call} <item to untrack>`,
            value: 'Untrack items to be alerted in this channel.',
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

module.exports = Prefix;
