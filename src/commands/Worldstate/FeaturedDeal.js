'use strict';

const Command = require('../../models/Command.js');
const SalesEmbed = require('../../embeds/SalesEmbed.js');
const { createGroupedArray, createPageCollector } = require('../../CommonFunctions');


/**
 * Displays current featured deals
 */
class FeaturedDeal extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'warframe.worldstate.featureddeal', 'featureddeal', 'Displays current featured deals');
    this.regex = new RegExp('^featured\\s?deals?(?:\\s+on\\s+([pcsxb14]{2,3}))?$', 'i');
  }

  async run(message, ctx) {
    const platformParam = message.strippedContent.match(this.regex)[1];
    const platform = platformParam || ctx.platform;
    const ws = await this.bot.worldStates[platform.toLowerCase()].getData();
    const sales = ws.flashSales.filter(popularItem => popularItem.isFeatured);
    const salesGroups = createGroupedArray(sales, 10);
    const pages = salesGroups.map(group => new SalesEmbed(this.bot, group, platform));
    const msg = await this.messageManager.embed(message, pages[0], true, false);
    await createPageCollector(msg, pages, message.author);
    return this.messageManager.statuses.SUCCESS;
  }
}

module.exports = FeaturedDeal;
