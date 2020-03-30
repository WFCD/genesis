'use strict';

const ms = require('ms');

const Command = require('../../models/Command.js');
const { captures: { channel: cc }, giveawayDefaults } = require('../../CommonFunctions');

const channelCap = new RegExp(cc, 'i');

class StartGiveaway extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'giveaways.add', 'g start', 'Add a new Giveaway', 'GIVEAWAYS');
    this.requiresAuth = true;
    this.allowDM = false;
    this.regex = new RegExp(`^${this.call}`, 'i');
    this.usages = [
      {
        description: 'Start a giveaway. Format: `/g start 2w 1 Awesome Prize!`',
        parameters: ['time', 'winners', '*channel', 'prize'],
      },
    ];
  }

  /**
   * Run the command
   * @param {Message} message Message with a command to handle, reply to,
   *                          or perform an action based on parameters.
   * @returns {string} success status
   */
  async run(message) {
    let time;
    let prize;
    let channel;
    let winnerCount;
    let prizeTokens;
    try {
      [time, winnerCount, channel, ...prizeTokens] = message.strippedContent.replace(this.call, '').trim().split(/ +/g);
      if (channelCap.test(channel)) {
        [, channel] = (channel.match(channelCap) || []);
        if (channel && message.guild.channels.cache.has(channel)) {
          channel = message.guild.channels.cache.get(channel);
        }
      } else {
        prizeTokens.unshift(channel);
        channel = message.channel;
      }
      time = ms(time);
      prize = prizeTokens.join(' ');
      await this.bot.giveaways.start(channel, {
        time, prize, winnerCount, ...giveawayDefaults,
      });
      return this.messageManager.statuses.SUCCESS;
    } catch (e) {
      this.logger.error(e);
      message.reply(`Message parameters \`[${time}, ${winnerCount}, ${channel}, ${prize}]\` were invalid. Please retry.`);
      return this.messageManager.statuses.FAILURE;
    }
  }
}

module.exports = StartGiveaway;
