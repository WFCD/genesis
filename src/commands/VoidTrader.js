'use strict';

const Command = require('../Command.js');
const VoidTraderEmbed = require('../embeds/VoidTraderEmbed.js');

/**
 * Displays the currently active Invasions
 */
class VoidTrader extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'ondemand.baro', 'baro', 'Display the current status of the Void Trader');
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
        const voidTrader = ws.voidTrader;
        return message.channel.sendEmbed(new VoidTraderEmbed(this.bot, voidTrader));
      }).then(() => {
        if (message.deletable) {
          return message.delete(2000);
        }
        return Promise.resolve();
      })
      .catch(this.logger.error);
  }
}

module.exports = VoidTrader;
