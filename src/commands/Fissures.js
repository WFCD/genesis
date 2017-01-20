'use strict';

const Command = require('../Command.js');
const FissureEmbed = require('../embeds/FissureEmbed.js');

/**
 * Displays the currently active Invasions
 */
class Fissures extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'ondemand.fissures', 'fissures', 'Get the current list of Void Fissure Missions');
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
        const fissures = ws.fissures;
        return message.channel.sendEmbed(new FissureEmbed(this.bot, fissures));
      }).then(() => {
        if (message.deletable) {
          return message.delete(2000);
        }
        return Promise.resolve();
      })
      .catch(this.logger.error);
  }
}

module.exports = Fissures;
