'use strict';

const Command = require('../../Command.js');

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
    this.requiresAuth = true;
  }

  async run(message) {
    const fileContents = [];
    const commands = this.bot.commandHandler.commands
      .concat(this.bot.commandHandler.inlineCommands || [])
      .concat(this.bot.commandHandler.customCommands || []);
    commands
      .filter(command =>
        !command.ownerOnly || (message.author.id === this.bot.owner && command.ownerOnly))
      .forEach((command) => {
        fileContents.push(`"${command.call}","${command.id}","${command.blacklistable ? 'blacklistable' : 'not blacklistable'}"`);
      });

    if (message.channel.type !== 'dm') {
      this.messageManager.reply(message, 'Check your direct messages for more information.', true, true);
    }
    this.messageManager.sendFileToAuthor(message, Buffer.from(fileContents.join('\n'), 'ascii'), 'command_ids.csv', true);
    return this.messageManager.statuses.SUCCESS;
  }
}

module.exports = GetCommandIds;
