'use strict';

const Command = require('../../Command.js');

/**
 * Displays the Warframe Progression Chart
 */
class Progression extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'warframe.misc.progress', 'progress', 'Display Warframe Progression Chart');
    this.progressionChart = 'https://i.imgur.com/aulXjWx.png';
  }

  /**
   * Run the command
   * @param {Message} message Message with a command to handle, reply to,
   *                          or perform an action based on parameters.
   */
  run(message) {
    this.messageManager.sendFile(message,
      `Operator ${message.author.toString()}, the progression flowchart, at your request.`,
      this.progressionChart, 'Progress.png', true);
  }
}

module.exports = Progression;
