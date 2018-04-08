'use strict';

const Command = require('../../models/Command.js');

/**
 * Echo what the user says
 */
class Echo extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'silly.echo', 'echo', 'Genesis echos your message');
    this.regex = new RegExp(`^${this.call}\\s?(.+)?`, 'i');
  }

  /**
   * Run the command
   * @param {Message} message Message with a command to handle, reply to,
   *                          or perform an action based on parameters.
   * @returns {string} success status
   */
  async run(message) {
    if (message.deleteable) {
      await message.delete();
    }
    await this.messageManager.sendMessage(message, message.strippedContent.replace(this.call, '').trim(), false, false);
    return this.messageManager.statuses.SUCCESS;
  }
}

module.exports = Echo;
