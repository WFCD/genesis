'use strict';

const Command = require('../../models/InlineCommand.js');

const letters = ['🇦', '🇧', '🇨', '🇩', '🇪', '🇫', '🇬', '🇭', '🇮', '🇯'];

/**
 * Make a simple poll
 */
class PollInline extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot The bot object
   */
  constructor(bot) {
    super(bot, 'poll', 'multipoll:', 'Create a simple poll');
    this.regex = new RegExp('multipoll\\s*\\((\\d*)\\):\\s*.*', 'i');
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
   * @returns {string} status
   */
  async run(message) {
    const res = message.strippedContent.match(this.regex);
    let amt = res[1] || 3;
    amt = amt < 11 ? amt : 10;
    if (message.channel.permissionsFor(this.bot.client.user.id)
      .has(['USE_EXTERNAL_EMOJIS', 'ADD_REACTIONS'])) {
      letters.forEach(async (letter, index) => {
        if (index < amt) {
          await message.react(letter);
        }
      });
    }
    return this.messageManager.statuses.NO_ACCESS;
  }
}

module.exports = PollInline;
