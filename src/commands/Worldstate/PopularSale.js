'use strict';

const Command = require('../../models/Command.js');
const SalesEmbed = require('../../embeds/SalesEmbed.js');
const { captures } = require('../../CommonFunctions');

/**
 * Displays current popular sales
 */
class PopularDeal extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'warframe.worldstate.populardeals', 'popular deal', 'Displays current featured deals', 'WARFRAME');
    this.regex = new RegExp(`^popular\\s?deals?(?:\\s+on\\s+${captures.platforms})?$`, 'i');
  }

  async run(message, ctx) {
    const platformParam = message.strippedContent.match(this.regex)[1];
    const platform = platformParam || ctx.platform;
    const sales = (await this.ws.get('flashSales', platform, ctx.language))
      .filter(popularItem => popularItem.isPopular);
    const embed = new SalesEmbed(this.bot, sales, platform);
    await message.reply({ embeds: [embed] });
    return this.messageManager.statuses.SUCCESS;
  }
}

module.exports = PopularDeal;
