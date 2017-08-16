'use strict';

const Command = require('../../Command.js');
const SimarisEmbed = require('../../embeds/SimarisEmbed.js');

/**
 * Displays the current simaris target
 */
class Simaris extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'warframe.worldstate.simaris', 'simaris', 'Display current Sanctuary status.');
    this.regex = new RegExp(`^${this.call}(?:\\s+on\\s+([pcsxb14]{2,3}))?$`, 'i');
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
        const simaris = ws.simaris;
        this.messageManager.embed(message, new SimarisEmbed(this.bot, simaris), true, false);
      })
      .catch(this.logger.error);
  }
}

module.exports = Simaris;
