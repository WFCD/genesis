'use strict';

const Command = require('../../Command.js');
const NewsEmbed = require('../../embeds/NewsEmbed.js');

/**
 * Displays the currently active warframe news
 */
class News extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'warframe.worldstate.news', 'news', 'Display the currently active news');
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
        const news = ws.news;
        this.messageManager.embed(message, new NewsEmbed(this.bot, news.filter(n => !n.isUpdate() && !n.isPrimeAccess())), true, false);
      })
      .catch(this.logger.error);
  }
}

module.exports = News;
