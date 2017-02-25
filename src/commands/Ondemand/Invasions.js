'use strict';

const Command = require('../../Command.js');
const InvasionEmbed = require('../../embeds/InvasionEmbed.js');

/**
 * Displays the currently active Invasions
 */
class Invasions extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'warframe.worldstate.invasions', 'invasion', 'Display the currently active Invasions');
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
        const invasions = ws.invasions.filter(i => !i.completed);
        this.messageManager.embed(message,
          new InvasionEmbed(this.bot, invasions), true, false);
      })
      .catch(this.logger.error);
  }
}

module.exports = Invasions;
