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

  /**
   * Run the command
   * @param {Message} message Message with a command to handle, reply to,
   *                          or perform an action based on parameters.
   */
  run(message) {
    const platformParam = message.strippedContent.match(this.regex)[1];
    this.bot.settings.getChannelPlatform(message.channel)
      .then(platform => this.bot.caches[platformParam || platform].getDataJson())
      .then((ws) => {
        const news = ws.news.filter(n => n.primeAccess);
        this.messageManager.embed(message, new PrimeAccessEmbed(this.bot, news, 'primeaccess'), true, false);
      })
      .catch(this.logger.error);
  }
}

module.exports = PrimeAccess;
