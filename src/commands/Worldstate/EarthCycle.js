'use strict';

const Command = require('../../models/Command.js');
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
    super(bot, 'warframe.misc.cycle', 'cycle', 'Current and remaining time in cycle of Earth or Cetus rotations.');
    this.regex = new RegExp(`^${this.call}\\s?(earth)?`, 'i');
    this.usages = [
      {
        description: 'Display Cetus\'s current cycle progress',
        parameters: [],
      },
      {
        description: 'Display Earth\'s current cycle progress',
        parameters: ['earth'],
      },
    ];
  }

  /**
   * Run the command
   * @param {Message} message Message with a command to handle, reply to,
   *                          or perform an action based on parameters.
   * @param {Object} ctx      Context object with common command parameters
   * @returns {string} success status
   */
  async run(message, ctx) {
    let cycleData;
    const earth = (/earth/ig).test(message.strippedContent);
    const ws = await this.bot.worldStates[ctx.platform.toLowerCase()].getData();
    if (earth) {
      cycleData = ws.earthCycle;
    } else {
      cycleData = ws.cetusCycle;
      const ostrons = ws.syndicateMissions.filter(mission => mission.syndicate === 'Ostrons')[0];
      if (ostrons) {
        cycleData.bountyExpiry = ostrons.expiry;
      }
    }
    const embed = new EarthCycleEmbed(this.bot, cycleData);
    await this.messageManager.embed(message, embed, true, true);
    return this.messageManager.statuses.SUCCESS;
  }
}

module.exports = EarthCycle;
