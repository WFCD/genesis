'use strict';

const Command = require('../../Command.js');

/**
 * Hug Genesis
 */
class Hug extends Command {
  /**
   * Constructs a callable command
   * @param {Bot} bot The bot object
   */
  constructor(bot) {
    super(bot, 'silly.hug', 'hug', 'Hug Genesis');
  }

  /**
   * Run the command
   * @param {Message} message Message with a command to handle, reply to,
   *                          or perform an action based on parameters.
   */
  run(message) {
    this.messageManager.reply(message, '```haskell\nOperator, Cephalons do not g-g-g-give huuuu~~ Screw it. ⊂（♡⌂♡）⊃```', false, false);
  }
}

module.exports = Hug;
