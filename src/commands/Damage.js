'use strict';

const Command = require('../Command.js');

/**
 * Displays the Damage 2.0 charts
 */
class Damage extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'misc.damage', 'damage', 'Display Damage 2.0 chart');
    this.damageChart = 'http://i.imgur.com/EOzr440.png';
  }

  /**
   * Run the command
   * @param {Message} message Message with a command to handle, reply to,
   *                          or perform an action based on parameters.
   */
  run(message) {
    message.channel.sendFile(this.damageChart, 'Damage.png',
                             `Operator ${message.author.toString()}, the damage flowchart, at your request.`)
     .then(() => {
       if (message.deletable) {
         return message.delete(2000);
       }
       return Promise.resolve();
     }).catch(this.logger.error);
  }
}

module.exports = Damage;
