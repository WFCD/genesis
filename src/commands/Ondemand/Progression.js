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
    this.progressionChart = 'http://chart.warframestat.us';
  }

  /**
   * Run the command
   * @param {Message} message Message with a command to handle, reply to,
   *                          or perform an action based on parameters.
   */
  run(message) {
    message.channel.sendFile(this.progressionChart, 'progression.png',
                             `Operator ${message.author.toString()}, the progression flowchart, at your request.`)
     .then(() => {
       if (message.deletable) {
         return message.delete(2000);
       }
       return Promise.resolve();
     }).catch(this.logger.error);
  }
}

module.exports = Progression;
