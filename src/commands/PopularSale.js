'use strict';

const Command = require('../Command.js');
const SalesEmbed = require('../embeds/SalesEmbed.js');

/**
 * Displays current popular sales
 */
class PopularSale extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'ondemand.populardeals', 'populardeals', 'Displays current featured deals');
    this.regex = new RegExp(`^${this.bot.escapedPrefix}popular\\sdeals?$`, 'i');
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
        const sales = ws.flashSales.filter(popularItem => popularItem.isPopular);
        return message.channel.sendEmbed(new SalesEmbed(this.bot, sales));
      })
      .catch(this.logger.error);
  }
}

module.exports = PopularSale;
