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

  async run(message, ctx) {
    if (message.deleteable) {
      await message.delete();
    }
    const content = message.cleanContent.replace(this.call, '').replace(ctx.prefix, '').trim();
    if (content.length) await message.channel.send({ content });
    return this.constructor.statuses.SUCCESS;
  }
}

module.exports = Echo;
