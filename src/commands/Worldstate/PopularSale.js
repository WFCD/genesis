'use strict';

const Command = require('../../Command.js');
const SalesEmbed = require('../../embeds/SalesEmbed.js');

/**
 * Displays current popular sales
 */
class PopularDeal extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'warframe.worldstate.populardeals', 'populardeals', 'Displays current featured deals');
    this.regex = new RegExp('^popular\\sdeals?$', 'i');
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
        const sales = ws.flashSales.filter(popularItem => popularItem.isPopular);
        this.messageManager.embed(message, new SalesEmbed(this.bot, sales), true, false);
      })
      .catch(this.logger.error);
  }
}

module.exports = PopularDeal;
