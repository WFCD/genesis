'use strict';

const Command = require('../../Command.js');

/**
 * Displays the Damage 2.0 charts
 */
class Damage extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'warframe.misc.damage', 'damage', 'Display Damage 2.0 chart');
    this.damageChart = 'http://i.imgur.com/EOzr440.png';
  }

  /**
   * Run the command
   * @param {Message} message Message with a command to handle, reply to,
   *                          or perform an action based on parameters.
   * @returns {string} success status
   */
  async run(message) {
    this.messageManager.embed(message, {
      title: 'Legend',
      image: {
        url: 'http://i.imgur.com/EOzr440.png',
      },
      fields: [
        { name: 'Blast', value: '<:blast:321463957292318720>', inline: true },
        { name: 'Cold', value: '<:cold:321463957019951105>', inline: true },
        { name: 'Corrosive', value: '<:corrosive:321463957305032714>', inline: true },
        { name: 'Electricity', value: '<:electricity:321463957212626944>', inline: true },
        { name: 'Gas', value: '<:gas:321463957259026432>', inline: true },
        { name: 'Heat', value: '<:heat:321463957061763083>', inline: true },
        { name: 'Impact', value: '<:impact:321463957221015562>', inline: true },
        { name: 'Magnetic', value: '<:magnetic:321463957984641024>', inline: true },
        { name: 'Puncture', value: '<:puncture:321463957296775168>', inline: true },
        { name: 'Radiation', value: '<:radiation:321463957221277706>', inline: true },
        { name: 'Slash', value: '<:slash:321463957296644103>', inline: true },
        { name: 'Toxin', value: '<:toxin:321463957325873153>', inline: true },
        { name: 'Viral', value: '<:viral:321463957292580864>', inline: true },
      ],
    }, true, false);
    return this.messageManager.statuses.SUCCESS;
  }
}

module.exports = Damage;
