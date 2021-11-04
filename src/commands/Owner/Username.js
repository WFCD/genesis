'use strict';

const Command = require('../../models/Command.js');

/**
 * Sets the username for the bot
 */
class Username extends Command {
  /**
   * Constructs a callable command
   * @param {Bot} bot The bot object
   */
  constructor(bot) {
    super(bot, 'core.username', 'username', 'Set Bot username', 'CORE');
    this.ownerOnly = true;
    this.regex = new RegExp(`^${this.call}\\s*(.*)?`, 'i');
    this.usages = [
      {
        description: 'Set the bot\'s username',
        parameters: ['username'],
      },
    ];
  }

  async run(message) {
    const username = message.strippedContent.match(this.regex)[1];
    try {
      await this.bot.client.user.setUsername(username);
      await message.reply({ content: 'New Username set!' });
      return this.constructor.statuses.SUCCESS;
    } catch (e) {
      this.logger.error(e);
      return this.constructor.statuses.FAILURE;
    }
  }
}

module.exports = Username;
