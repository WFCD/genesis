'use strict';

const Command = require('../../Command.js');
const eventTypes = require('../../resources/trackables.json').eventTypes;

/**
 * Sets the current guild's custom prefix
 */
class EnablePingEvent extends Command {
  constructor(bot) {
    super(bot, 'settings.ping.event.enable', 'ping on event');
    this.usages = [
      { description: 'Show command for pinging for items', parameters: [] },
      { description: 'Enable pinging for an event or events', parameters: ['event(s) to enable ping for'] },
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
    let itemsToPing = [];
    if (items[0] === 'all') {
      itemsToPing = itemsToPing.concat(eventTypes);
    } else {
      items.forEach((item) => {
        if (eventTypes.includes(item.trim())) {
          itemsToPing.push(item.trim());
        } else {
          this.sendInstructionEmbed(message);
        }
      });
    }

    const promises = [];
    itemsToPing.forEach(item => promises.push(this.bot.settings
      .setEventTypePing(message.channel, item, true)));

    promises.forEach(promise => promise.catch(this.logger.error));
    this.messageManager.notifySettingsChange(message, true, true);
  }

  sendInstructionEmbed(message) {
    this.bot.settings.getChannelPrefix(message.channel)
      .then(prefix => this.messageManager.embed(message, {
        title: 'Usage',
        type: 'rich',
        color: 0x0000ff,
        fields: [
          {
            name: `${prefix}${this.call} <event to ping for>`,
            value: 'Enable pinging for an event',
          },
          {
            name: 'Possible values:',
            value: `\n${eventTypes.join('\n')}`,
          },
        ],
      }, true, false))
      .catch(this.logger.error);
  }
}

module.exports = EnablePingEvent;
