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
    super(bot, 'silly.echo', 'echo', 'Echo your message', 'FUN');
    this.regex = new RegExp(`^${this.call}\\s?(.+)?`, 'i');
  }

  /**
   * Run the command
   * @param {Message} message Message with a command to handle, reply to,
   *                          or perform an action based on parameters.
   * @param {Object} ctx command call context
   * @returns {string} success status
   */
  async run(message, ctx) {
    if (message.deleteable) {
      await message.delete();
    }
    await message.channel.send({ content: message.cleanContent.replace(this.call, '').replace(ctx.prefix, '').trim() });
    return this.constructor.statuses.SUCCESS;
  }
}

module.exports = Echo;
