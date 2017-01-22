'use strict';

const Command = require('../Command.js');
const SortieEmbed = require('../embeds/SortieEmbed.js');

/**
 * Displays the currently active Invasions
 */
class Sorties extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'ondemand.sorties', 'sortie', 'Display the currently active sorties');
    this.regex = new RegExp(`^${this.bot.escapedPrefix}${this.call}s?$`, 'i');
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
        const sortie = ws.sortie;
        if (sortie.isExpired()) {
          return message.channel.sendMessage('There is currently no sortie');
        }
        return message.channel.sendEmbed(new SortieEmbed(this.bot, sortie));
      }).then(() => {
        if (message.deletable) {
          return message.delete(2000);
        }
        return Promise.resolve();
      })
      .catch(this.logger.error);
  }
}

module.exports = Sorties;
