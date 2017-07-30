'use strict';

const Command = require('../../Command.js');
const FissureEmbed = require('../../embeds/FissureEmbed.js');

/**
 * Displays the currently active Invasions
 */
class Fissures extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'warframe.worldstate.fissures', 'fissures', 'Get the current list of Void Fissure Missions');
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
        const fissures = ws.fissures.sort((a, b) => a.tierNum > b.tierNum);
        this.messageManager.embed(message,
          new FissureEmbed(this.bot, fissures), true, false);
      })
      .catch(this.logger.error);
  }
}

module.exports = Fissures;
