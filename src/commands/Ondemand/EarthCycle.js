'use strict';

const Command = require('../../Command.js');
const EarthCycleEmbed = require('../../embeds/EarthCycleEmbed.js');

/**
 * Displays the current stage in Earth's cycle
 */
class EarthCycle extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'warframe.misc.cycle', 'cycle', 'Current and remaining time in cycle of Earth rotation.');
  }

  /**
   * Run the command
   * @param {Message} message Message with a command to handle, reply to,
   *                          or perform an action based on parameters.
   * @returns {string} success status
   */
  async run(message) {
    const ws = await this.bot.caches.pc.getDataJson();
    const embed = new EarthCycleEmbed(this.bot, ws.earthCycle);
    await this.messageManager.embed(message, embed, true, true);
    return this.messageManager.statuses.SUCCESS;
  }
}

module.exports = EarthCycle;
