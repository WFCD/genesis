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
    this.regex = new RegExp(`^${this.call}s?(?:\\s+on\\s+([pcsxb14]{2,3}))?$`, 'i');
  }

  /**
   * Run the command
   * @param {Message} message Messdsage with a command to handle, reply to,
   *                          or perform an action based on parameters.
   */
  run(message) {
    const platformParam = message.strippedContent.match(this.regex)[1];
    this.bot.settings.getChannelPlatform(message.channel)
      .then(platform => this.bot.caches[platformParam || platform].getDataJson())
      .then((ws) => {
        const invasions = ws.invasions.filter(i => !i.completed);
        this.messageManager.embed(message,
          new InvasionEmbed(this.bot, invasions), true, false);
      })
      .catch(this.logger.error);
  }
}

module.exports = Invasions;
