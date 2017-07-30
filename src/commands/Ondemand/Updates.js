'use strict';

const Command = require('../../Command.js');
const UpdateEmbed = require('../../embeds/NewsEmbed.js');

/**
 * Displays the currently active Warframe update news
 */
class Updates extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'warframe.worldstate.updates', 'updates', 'Display the currently active update news');
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
        const news = ws.news.filter(n => n.update);
        this.messageManager.embed(message, new UpdateEmbed(this.bot, news, 'update'), true, false);
      })
      .catch(this.logger.error);
  }
}

module.exports = Updates;
