'use strict';

const Command = require('../../Command.js');
const trackFunctions = require('../../TrackFunctions.js');
const eventTypes = require('../../resources/trackables.json').eventTypes;
const rewardTypes = require('../../resources/trackables.json').rewardTypes;

class SetPing extends Command {
  constructor(bot) {
    super(bot, 'settings.setping', 'set ping');
    this.usages = [
      { description: 'Set ping for an event or item', parameters: ['event or reward', '@role or user mention'] },
    ];
    this.regex = new RegExp(`^${this.call}\\s+?((${eventTypes.join('|')}|${rewardTypes.join('|')}|all|events|items|fissures|syndicates|conclave)(.+)?)?$`, 'i');
    this.requiresAuth = true;
    this.allowDM = false;
  }

  async run(message) {
    const regex = new RegExp(`(${eventTypes.join('|')}|${rewardTypes.join('|')}|all|events|items|fissures|syndicates|conclave)(.+)?`, 'i');
    const match = message.content.match(regex);
    if (message.channel.type === 'dm') {
      this.messagemanager.reply(message, 'Operator, you can\'t do that privately, it\'s the same as directly messaging you anyway!');
      return this.messageManager.statuses.FAILURE;
    } else if (match) {
      const trackables = trackFunctions.trackablesFromParameters(match[1].trim());
      const eventsAndItems = [].concat(trackables.events).concat(trackables.items);
      const pingString = match[2] ? match[2].trim() : undefined;

      if (!eventsAndItems.length) {
        const prefix = await this.bot.settings.getChannelSetting(message.channel, 'prefix');
        this.messageManager.embed(message,
          trackFunctions.getTrackInstructionEmbed(message, prefix, this.call), true, true);
        return this.messageManager.statuses.FAILURE;
      }
      if (!pingString) {
        const results = [];
        for (const eventOrItem of eventsAndItems) {
          if (eventOrItem) {
            if (!pingString) {
              results.push(this.bot.settings.removePing(message.guild, eventOrItem));
            } else {
              results.push(this.bot.settings.setPing(message.guild, eventOrItem, pingString));
            }
          }
        }
        Promise.all(results);
      }
      this.messageManager.notifySettingsChange(message, true, true);
      return this.messageManager.statuses.SUCCESS;
    }
    const prefix = await this.bot.settings.getChannelSetting(message.channel, 'prefix');
    this.messageManager.embed(message, trackFunctions
        .getTrackInstructionEmbed(message, prefix, this.call), true, true);
    return this.messageManager.statuses.FAILURE;
  }
}

module.exports = SetPing;
