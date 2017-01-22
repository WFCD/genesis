'use strict';

const Command = require('../Command.js');
const SalesEmbed = require('../embeds/SalesEmbed.js');

/**
 * Displays current featured deals
 */
class FeaturedDeal extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'ondemand.featureddeal', 'featureddeal', 'Displays current featured deals');
    this.regex = new RegExp(`^${this.bot.escapedPrefix}featured\\sdeals?$`, 'i');
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
        const sales = ws.flashSales.filter(popularItem => popularItem.isFeatured);
        return message.channel.sendEmbed(new SalesEmbed(this.bot, sales));
      })
      .catch(this.logger.error);
  }
}

module.exports = FeaturedDeal;
