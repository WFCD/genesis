'use strict';

const Command = require('../../models/Command.js');
const SalesEmbed = require('../../embeds/SalesEmbed.js');

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

  async run(message) {
    const platformParam = message.strippedContent.match(this.regex)[1];
    const platform = platformParam || await this.settings.getChannelSetting(message.channel, 'platform');
    const ws = await this.bot.caches[platform.toLowerCase()].getDataJson();
    const sales = ws.flashSales.filter(popularItem => popularItem.isFeatured);
    await this.messageManager.embed(
      message,
      new SalesEmbed(this.bot, sales, platform), true, false,
    );
    return this.messageManager.statuses.SUCCESS;
  }
}

module.exports = FeaturedDeal;
