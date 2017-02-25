'use strict';

const Command = require('../../Command.js');

/**
 * Sets the avatar for the bot
 */
class Avatar extends Command {
  /**
   * Constructs a callable command
   * @param {Bot} bot The bot object
   */
  constructor(bot) {
    super(bot, 'core.avatar', 'avatar', 'Set Bot avatar');
    this.ownerOnly = true;
    this.regex = new RegExp(`^${this.call}\\s*(.*)?`, 'i');
    this.usages = [
      {
        description: 'Set the bot\'s avatar url',
        parameters: ['avatar url'],
      },
    ];
  }

  /**
   * Run the command
   * @param {Message} message Message with a command to handle, reply to,
   *                          or perform an action based on parameters.
   */
  run(message) {
    const url = message.strippedContent.match(this.regex)[1];
    this.bot.client.user.setAvatar(url)
    .then(() => message.reply('New avatar set!'))
    .catch(this.logger.error);
  }
}

module.exports = Avatar;
