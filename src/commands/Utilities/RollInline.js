'use strict';

const Command = require('../../InlineCommand.js');

/**
 * Make a simple roll
 */
class RollInline extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot The bot object
   */
  constructor(bot) {
    super(bot, 'roll', 'roll?', 'Roll between 2 rivens');
    this.regex = new RegExp('roll\?', 'ig');
    this.usages = [
      {
        description: 'roll between rivens',
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
      await message.react('⬅');
      await message.react('➡');
    }
  }
}

module.exports = RollInline;
