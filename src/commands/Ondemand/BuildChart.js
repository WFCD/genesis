'use strict';

const Command = require('../../Command.js');

const buildChart = 'http://i.imgur.com/9g6iIff.png';

/**
 * Displays the weapon crafting chart
 */
class BuildChart extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'warframe.misc.buildchart', 'buildchart', 'Display Weapon Build Flowchart chart');
  }

  /**
   * Run the command
   * @param {Message} message Message with a command to handle, reply to,
   *                          or perform an action based on parameters.
   */
  run(message) {
    this.messageManager.embed(message, {
      color: 0xBCC9EB,
      image: {
        url: buildChart,
      },
    }, true, false);
  }
}

module.exports = BuildChart;
