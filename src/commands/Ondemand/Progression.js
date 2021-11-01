'use strict';

const Command = require('../../models/Command.js');

const embed = {
  color: 0xBCC9EB,
  image: {
    url: 'https://warframestat.us/chart.low.png',
  },
};

/**
 * Displays the Warframe Progression Chart
 */
class Progression extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'warframe.misc.progress', 'progress', 'Display Warframe Progression Chart', 'WARFRAME');
  }

  async run(message) {
    await message.reply({ content: `Operator ${message.author.toString()}, the progression flowchart, at your request.`, embeds: [embed] });
    return this.messageManager.statuses.SUCCESS;
  }
}

module.exports = Progression;
