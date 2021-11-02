'use strict';

const Command = require('../../models/Command.js');
const { assetBase } = require('../../CommonFunctions');

const efficiencyChart = `${assetBase}/img/efficiency-chart.png`;

/**
 * Displays the Warframe efficincy/duration Chart
 */
class Efficiency extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'warframe.misc.efficiency', 'efficiency', 'Display Warframe Efficiency Chart', 'WARFRAME');
  }

  async run(message) {
    await message.reply({
      content: `Operator ${message.author.toString()}, the efficiency table, at your request.`,
      files: [{ attachment: efficiencyChart, name: 'efficiency.png' }],
    });
    return this.messageManager.statuses.SUCCESS;
  }
}

module.exports = Efficiency;
