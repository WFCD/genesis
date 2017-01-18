'use strict';

const Command = require('../Command.js');
const PrimeAccessEmbed = require('../embeds/NewsEmbed.js');

/**
 * Displays the currently active warframe prime access news
 */
class PrimeAccess extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'ondemand.primeaccess', 'primeaccess', 'Display the currently active prime access news');
    this.regex = new RegExp(`^${this.bot.escapedPrefix}prime\\s?access$`, 'i');
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
        const news = ws.news.filter(n => n.isPrimeAccess());
        return message.channel.sendEmbed(new PrimeAccessEmbed(this.bot, news, 'primeaccess'));
      }).then(() => {
        if (message.deletable) {
          return message.delete(2000);
        }
        return Promise.resolve();
      })
      .catch(this.logger.error);
  }
}

module.exports = PrimeAccess;
