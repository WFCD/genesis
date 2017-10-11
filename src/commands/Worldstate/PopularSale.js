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
    super(bot, 'warframe.worldstate.populardeals', 'populardeal', 'Displays current featured deals');
    this.regex = new RegExp('^popular\\sdeals?(?:\\s+on\\s+([pcsxb14]{2,3}))?$', 'i');
  }

  async run(message) {
    const platformParam = message.strippedContent.match(this.regex)[1];
    const platform = platformParam || await this.bot.settings.getChannelSetting(message.channel, 'platform');
    const ws = await this.bot.caches[platform.toLowerCase()].getDataJson();
    const sales = ws.flashSales.filter(popularItem => popularItem.isPopular);
    await this.messageManager.embed(
      message,
      new SalesEmbed(this.bot, sales, platform), true, false,
    );
    return this.messageManager.statuses.SUCCESS;
  }
}

module.exports = PopularDeal;
