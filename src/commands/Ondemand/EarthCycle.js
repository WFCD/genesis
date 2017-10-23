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
    this.regex = new RegExp(`^${this.call}\\s?(earth)?`, 'i');
  }

  /**
   * Run the command
   * @param {Message} message Message with a command to handle, reply to,
   *                          or perform an action based on parameters.
   * @returns {string} success status
   */
  async run(message) {
    let cycleData;
    const matches = message.content.match(this.regex);
    const ws = await this.bot.caches.pc.getDataJson();
    if (matches ? matches[1] : false) {
      cycleData = ws.earthCycle;
    } else {
      cycleData = ws.cetusCycle;
      cycleData.bountyExpireStr = `\nBounties expire in ${ws.syndicateMissions.filter(mission => mission.syndicate === 'Ostrons')[0].eta}`;
    }
    const embed = new EarthCycleEmbed(this.bot, cycleData);
    await this.messageManager.embed(message, embed, true, true);
    return this.messageManager.statuses.SUCCESS;
  }
}

module.exports = EarthCycle;
