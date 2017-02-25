'use strict';

const Command = require('../../Command.js');

/**
 * Reloads the script containing the commands
 */
class Reload extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot The bot object
   */
  constructor(bot) {
    super(bot, 'core.reload', 'reload', 'Reload bot modules');
    this.ownerOnly = true;
  }

  /**
   * Run the command
   * @param {Message} message Message with a command to handle, reply to,
   *                          or perform an action based on parameters.
   */
  run(message) {
    this.logger.debug('Reloading modules');
    const commandsBefore = this.commandHandler.commands.map(c => c.id);
    this.commandHandler.loadCommands();
    const commandsAfter = this.commandHandler.commands.map(c => c.id);

    const commandsAdded = commandsAfter.filter(command => !commandsBefore.includes(command));
    const commandsRemoved = commandsBefore.filter(command => !commandsAfter.includes(command));

    const commandsAddedString = commandsAdded.length > 0 ? commandsAdded.sort().join(' ') : ' No Commands Added';
    const commandsRemovedString = commandsRemoved.length > 0 ? commandsRemoved.sort().join(' ') : ' No Commands Removed';

    this.messageManager.sendMessage(message, `${this.md.codeMulti}Commands reloaded!${this.md.blockEnd}` +
      `${this.md.lineEnd}\`\`\`diff${this.md.lineEnd}-${commandsRemovedString}\`\`\`\n` +
      `\`\`\`diff${this.md.lineEnd}+${commandsAddedString}\`\`\``, true, true);
  }
}

module.exports = Reload;
