'use strict';

const Command = require('./Command.js');

/**
 * Describes a callable command
 */
class CustomCommand extends Command {
  /**
   * Base class for inline bot commands
   * @param {Genesis} bot  The bot object
   * @param {string}  id   The command's unique id
   * @param {string}  call The string that invokes this command
   * @param {string}  description A description for this command
   */
  constructor(bot, id, call, description) {
    super(bot, `inline.${id}`, call, description);
    this.regex = /test/ig;
    this.isInline = true;
  }

  /**
   * Run the command
   * @param {Message} message Message with a command to handle, reply to,
   *                          or perform an action based on parameters.
   */
  run(message) {
    this.messageManager.reply(message, 'An inline command');
  }
}

module.exports = CustomCommand;
