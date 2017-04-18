'use strict';

const Command = require('../../Command.js');

/**
 * Sets the current guild's custom prefix
 */
class Untrack extends Command {
  constructor(bot) {
    super(bot, 'settings.start', 'start', 'Lols');
    this.requiresAuth = true;
  }

  /**
   * Run the command
   * @param {Message} message Message with a command to handle, reply to,
   *                          or perform an action based on parameters.
   */
  run(message) {
    this.messageManager.reply(message, 'That\'s so 2016, Operator, in 2017, Cephalon Genesis uses `/track` and that\'s all', true, false);
  }
}

module.exports = Untrack;
