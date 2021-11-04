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
  run(message) {
    return message.reply({ content: 'An inline command' });
  }
}

module.exports = CustomCommand;
