'use strict';

const Command = require('../../models/Command.js');

/**
 * Sets the avatar for the bot
 */
class Avatar extends Command {
  /**
   * Constructs a callable command
   * @param {Bot} bot The bot object
   */
  constructor(bot) {
    super(bot, 'core.avatar', 'avatar', 'Set Bot avatar', 'CORE');
    this.ownerOnly = true;
    this.regex = new RegExp(`^${this.call}\\s*(.*)?`, 'i');
    this.usages = [
      {
        description: 'Set the bot\'s avatar url',
        parameters: ['avatar url'],
      },
    ];
  }

  async run(message) {
    const url = message.strippedContent.match(this.regex)[1];
    try {
      await this.bot.client.user.setAvatar(url);
      await message.reply({ content: 'New avatar set!' });
      return this.constructor.statuses.SUCCESS;
    } catch (e) {
      this.logger.error(e);
      return this.constructor.statuses.FAILURE;
    }
  }
}

module.exports = Avatar;