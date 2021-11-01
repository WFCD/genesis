'use strict';

const Command = require('../../models/Command.js');

const buildChart = 'https://vignette3.wikia.nocookie.net/warframe/images/6/66/Ww.jpg/revision/latest';

/**
 * Displays the weapon crafting chart
 */
class BuildChart extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'warframe.misc.buildchart', 'buildchart', 'Display Weapon Build Flowchart chart', 'WARFRAME');
  }

  /**
   * Run the command
   * @param {Message} message Message with a command to handle, reply to,
   *                          or perform an action based on parameters.
   * @returns {string} success status
   */
  async run(message) {
    const embed = {
      color: 0xBCC9EB,
      image: {
        url: buildChart,
      },
    };

    await message.reply({ embeds: [embed] });
    return this.messageManager.statuses.SUCCESS;
  }
}

module.exports = BuildChart;
