'use strict';

const Command = require('../../Command.js');
const eventTypes = require('../../resources/trackables.json').eventTypes;
const rewardTypes = require('../../resources/trackables.json').rewardTypes;

class SetPing extends Command {
  constructor(bot) {
    super(bot, 'settings.setping', 'set ping');
    this.usages = [
      { description: 'Set ping for an event or item', parameters: ['event or reward'] },
    ];
    this.regex = new RegExp(`^${this.call}\\s?((${eventTypes.join('|')}|${rewardTypes.join('|')})(.+)?)?$`, 'i');
    this.requiresAuth = true;
  }

  run(message) {
    const regex = new RegExp(`(${eventTypes.join('|')}|${rewardTypes.join('|')})(.+)?`, 'i');
    const match = message.content.match(regex);
    if (message.channel.type === 'dm') {
      this.messagemanager.reply(message, 'Operator, you can\'t do that privately, it\'s the same as directly messaging you anyway!');
    } else if (match) {
      const eventOrItem = match[1].trim();
      const pingString = match[2] ? match[2].trim() : undefined;

      if (!eventOrItem || !eventTypes.concat(rewardTypes).includes(eventOrItem)) {
        this.sendInstructions(message);
      } else if (!pingString) {
        this.bot.settings.removePing(message.guild, eventOrItem).then(() => {
          this.messageManager.notifySettingsChange(message, true, true);
        }).catch(this.logger.error);
      } else {
        this.bot.settings.setPing(message.guild, eventOrItem, pingString).then(() => {
          this.messageManager.notifySettingsChange(message, true, true);
        }).catch(this.logger.error);
      }
    } else {
      this.sendInstructions(message);
    }
  }

  sendInstructions(message) {
    this.bot.settings.getChannelPrefix(message.channel)
      .then(prefix => this.messageManager.embed(message, {
        title: 'Usage',
        type: 'rich',
        color: 0x0000ff,
        fields: [
          {
            name: `${prefix}${this.call} <event(s)/item(s) to ping for>`,
            value: 'Disable pinging for an event/item',
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
          {
            name: '**Ping:**',
            value: 'Whatever string you want to be added before a notification for this item or event',
            inline: true,
          },
        ],
      }, true, false))
      .catch(this.logger.error);
  }
}

module.exports = SetPing;
