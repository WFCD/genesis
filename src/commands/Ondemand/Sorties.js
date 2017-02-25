'use strict';

const Command = require('../../Command.js');
const SortieEmbed = require('../../embeds/SortieEmbed.js');

/**
 * Displays the currently active Invasions
 */
class Sorties extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'warframe.worldstate.sorties', 'sortie', 'Display the currently active sorties');
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
          this.messageManager.sendMessage(message, 'There is currently no sortie', true, true);
        }
        this.messageManager.embed(message, new SortieEmbed(this.bot, sortie), true, false);
      })
      .catch(this.logger.error);
  }
}

module.exports = Sorties;
