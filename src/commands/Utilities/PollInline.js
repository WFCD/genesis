'use strict';

const Command = require('../../InlineCommand.js');

/**
 * Make a simple poll
 */
class PollInline extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot The bot object
   */
  constructor(bot) {
    super(bot, 'poll', 'poll:', 'Create a simple poll');
    this.regex = new RegExp('poll\:.+', 'ig');
    this.usages = [
      {
        description: 'Create a simple poll',
        parameters: ['poll statement'],
      },
    ];
  }

  /**
   * Run the command
   * @param {Message} message Message with a command to handle, reply to,
   *                          or perform an action based on parameters.
   */
  async run(message) {
    if (message.channel.permissionsFor(this.bot.client.user.id)
      .has(['USE_EXTERNAL_EMOJIS', 'ADD_REACTIONS'])) {
      message.react('👍')
        .then(() => {
          return message.react('👎');
        })
        .then(() => {
          return message.react('🤷');
        })
        .catch(this.logger.error);
    }
  }
}

module.exports = PollInline;
