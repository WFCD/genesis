'use strict';

const Command = require('../Command.js');

/**
 * Reloads the script containing the commands
 */
class Reload extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot The bot object
   */
  constructor(bot) {
    super(bot, 'core.reload', 'reload', 'Reload bot modules [Owner only]');
    this.ownerOnly = true;
  }

  /**
   * Run the command
   * @param {Message} message Message with a command to handle, reply to,
   *                          or perform an action based on parameters.
   */
  run(message) {
    this.logger.debug('Reloading modules');
    const commandsBefore = this.commandHandler.commands.length;
    this.commandHandler.loadCommands();
    const commandsAfter = this.commandHandler.commands.length;

    message.reply(`${this.zSWC}${this.md.codeMulti}Commands reloaded!${this.md.blockEnd}` +
      `${this.md.lineEnd}\`\`\`diff${this.md.lineEnd}-${commandsBefore}` +
      `${this.md.lineEnd}+${commandsAfter}\`\`\``);
    if (message.deletable) {
      message.delete(5000);
    }
  }
}

module.exports = Reload;
