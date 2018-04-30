'use strict';

const Command = require('./Command.js');

/**
 * Describes a callable command
 */
class CustomCommand extends Command {
  /**
   * Base class for custom bot commands
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
    this.regex = new RegExp(`^${this.call}`, 'i');
  }

  /**
   * Run the command
   * @param {Message} message Message with a command to handle, reply to,
   *                          or perform an action based on parameters.
   * @parm {Object} ctx command context
   */
  async run(message, ctx) {
    let format;
    if (ctx['settings.cc.ping']) {
          format = `${message.mentions.members.size > 0 ? message.mentions.members.first() : message.member}, ${this.response}`;
    } else {
      format = this.response;
    }
    this.messageManager.sendMessage(message, format, false, false);
  }
}

module.exports = CustomCommand;
