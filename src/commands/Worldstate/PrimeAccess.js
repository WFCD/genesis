'use strict';

const Command = require('../../models/Command.js');
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

  async run(message, ctx) {
    const platformParam = message.strippedContent.match(this.regex)[1];
    const platform = platformParam || ctx.platform;
    const ws = await this.bot.worldStates[platform.toLowerCase()].getData();
    const news = ws.news.filter(n => n.primeAccess);
    await this.messageManager.embed(message, new PrimeAccessEmbed(this.bot, news, 'primeaccess', platform), true, false);
    return this.messageManager.statuses.SUCCESS;
  }
}

module.exports = PrimeAccess;
