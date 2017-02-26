'use strict';

const Command = require('../../Command.js');

/**
 * Displays the response time for the bot and checks Warframe's servers to see if they are up
 */
class Invite extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot The bot object
   */
  constructor(bot) {
    super(bot, 'core.invite', 'invite', 'Ping Genesis to test connectivity');
  }

  /**
   * Run the command
   * @param {Message} message Message with a command to handle, reply to,
   *                          or perform an action based on parameters.
   */
  run(message) {
    this.messageManager.reply(message, process.env.INVITE_URL || 'No Invite Set', true, false);
  }
}

module.exports = Invite;
