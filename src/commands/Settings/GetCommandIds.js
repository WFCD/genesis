'use strict';

const Command = require('../../Command.js');
const CommandIdEmbed = require('../../embeds/CommandIdEmbed.js');

/**
 * Get a list of all servers
 */
class GetCommandIds extends Command {
  /**
   * Constructs a callable command
   * @param {Bot} bot The bot object
   */
  constructor(bot) {
    super(bot, 'settings.getcommandids', 'getcommandids', 'Get list of bot command ids available for you to view');
  }

  /**
   * Run the command
   * @param {Message} message Message with a command to handle, reply to,
   *                          or perform an action based on parameters.
   */
  run(message) {
    const commands = this.commandHandler.commands.filter(command =>
      !command.ownerOnly || (message.author.id === this.bot.owner && command.ownerOnly));
    const embed = new CommandIdEmbed(this.bot, commands);
    if (message.channel.type !== 'dm') {
      this.messageManager.reply(message, 'Check your direct messages for more information.', true, true);
    }
    this.messageManager.sendDirectEmbedToAuthor(message, embed, false);
  }
}

module.exports = GetCommandIds;
