'use strict';

const Command = require('../../Command.js');
const PrimeAccessEmbed = require('../../embeds/NewsEmbed.js');

/**
 * Displays the currently active warframe prime access news
 */
class PrimeAccess extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'warframe.worldstate.primeaccess', 'primeaccess', 'Display the currently active prime access news');
    this.regex = new RegExp('^prime\\s?access(?:\\s+on\\s+([pcsxb14]{2,3}))?$', 'i');
  }

  async run(message) {
    const platformParam = message.strippedContent.match(this.regex)[1];
    const platform = platformParam || await this.bot.settings.getChannelPlatform(message.channel);
    const ws = await this.bot.caches[platform].getDataJson();
    const news = ws.news.filter(n => n.primeAccess);
    await this.messageManager.embed(message, new PrimeAccessEmbed(this.bot, news, 'primeaccess'), true, false);
    return this.messageManager.statuses.SUCCESS;
  }
}

module.exports = PrimeAccess;
