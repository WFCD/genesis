'use strict';

const Command = require('./Command.js');

/**
 * Describes a callable command
 */
class CustomCommand extends Command {
  /**
   * Base class for bot commands
   * @param {Genesis} bot  The bot object
   * @param {string}  call The string that invokes this command
   * @param {string}  response What the responds to the command
   * @param {string} guildId Guild id for the guild it was created in
   */
  constructor(bot, call, response, guildId) {
    super(bot, `custom.${call}`, call, `A cusom command responding ${response} to ${call}`);
    this.isCustomCommand = true;
    this.response = response;
    this.guildId = guildId;
  }

  /**
   * Run the command
   * @param {Message} message Message with a command to handle, reply to,
   *                          or perform an action based on parameters.
   */
  run(message) {
    this.messageManager.reply(message, this.response);
  }
}

module.exports = CustomCommand;
