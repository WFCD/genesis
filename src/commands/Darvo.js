'use strict';

const Command = require('../Command.js');
const DarvoEmbed = require('../embeds/DarvoEmbed.js');

/**
 * Displays today's Darvo deal
 */
class Darvo extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'ondemand.darvo', 'darvo', 'Displays today\'s Darvo deal');
  }

  /**
   * Run the command
   * @param {Message} message Message with a command to handle, reply to,
   *                          or perform an action based on parameters.
   */
  run(message) {
    this.bot.settings.getChannelPlatform(message.channel)
      .then(platform => this.bot.worldStates[platform].getData())
      .then((ws) => {
        const deal = ws.dailyDeals[0];
        return message.channel.sendEmbed(new DarvoEmbed(this.bot, deal));
      })
      .catch(this.logger.error);
  }
}

module.exports = Darvo;
