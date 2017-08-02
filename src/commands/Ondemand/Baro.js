'use strict';

const Command = require('../../Command.js');
const VoidTraderEmbed = require('../../embeds/VoidTraderEmbed.js');

/**
 * Displays the currently active Invasions
 */
class Baro extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'warframe.worldstate.baro', 'baro', 'Display the current status of the Void Trader');
  }

  /**
   * Run the command
   * @param {Message} message Message with a command to handle, reply to,
   *                          or perform an action based on parameters.
   */
  run(message) {
    this.bot.settings.getChannelPlatform(message.channel)
      .then(platform => this.bot.caches[platform].getDataJson())
      .then((ws) => {
        this.messageManager.embed(message,
          new VoidTraderEmbed(this.bot, ws.voidTrader), true, false);
      })
      .catch(this.logger.error);
  }
}

module.exports = Baro;
