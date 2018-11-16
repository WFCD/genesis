'use strict';

const Command = require('../../models/Command.js');
const EarthCycleEmbed = require('../../embeds/EarthCycleEmbed.js');
const MakeSimpleImage = require('../Image/MakeSimpleImage.js');

const earthResources = {
  readFile0: '././src/resources/earthdayModel.png',
  readFile1: '././src/resources/earthnightModel.png',
  sendFileCD: '././src/resources/cycleEarth.{ts}.png',
};

const cetusResources = {
  readFile0: '././src/resources/cetusdayModel.png',
  readFile1: '././src/resources/cetusnightModel.png',
  sendFileCD: '././src/resources/cycleCetus.{ts}.png',
};

const font = '././src/resources/CDfontSize40wnumber.fnt';

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
    const image = (/--?i(?:mage)?/ig).test(message.strippedContent);
    const ws = await this.bot.worldStates[ctx.platform.toLowerCase()].getData();
    if (image) {
      cycleData = earth ? ws.earthCycle : ws.cetusCycle;
      const model = earth ? earthResources : cetusResources;
      new MakeSimpleImage(
        cycleData.isDay,
        model.readFile0,
        model.readFile1,
        cycleData.timeLeft,
        font,
        model.sendFileCD,
        message,
      ).run();

      return this.messageManager.statuses.SUCCESS;
    }
    cycleData = earth ? ws.earthCycle : ws.cetusCycle;
    const ostrons = ws.syndicateMissions.filter(mission => mission.syndicate === 'Ostrons')[0];
    if (!earth && ostrons) {
      cycleData.bountyExpiry = ostrons.expiry;
    }
    const embed = new EarthCycleEmbed(this.bot, cycleData);
    await this.messageManager.embed(message, embed, true, true);
    return this.messageManager.statuses.SUCCESS;
  }
}

module.exports = EarthCycle;
