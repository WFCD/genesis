'use strict';

/**
 * Describes a callable command
 */
class Command {
  /**
   * Constructs a callable command
   * @param {Object} bot Bot to call command on
   */
  constructor(bot) {
    /**
     * Command Identifier
     * @type {string}
     */
    this.commandId = 'genesis.command';
    /**
     * Command regex for calling the command
     * @type {RegExp}
     */
    this.commandRegex = new RegExp(`^${bot.escapedPrefix}id$`, 'ig');
    /**
     * Help command for documenting the function or purpose of a command.
     * @type {string}
     */
    this.commandHelp = 'Prototype command';
    /**
     * The bot to operate the command against
     * @type {Genesis}
     */
    this.bot = bot;

    /**
     * Zero space whitespace character to prepend to any messages sent
     * to prevent a command from inadvertantly being triggered.
     * @type {string}
     */
    this.zSWC = '\u200B';
  }

  /**
   * Get the identifier for the command
   * @type {string}
   */
  get id() {
    return this.commandId;
  }

  /**
   * Get the call, which is the command regex for calling the command
   * @type {RegExp}
   */
  get call() {
    return this.commandRegex;
  }

  /**
   * Get the help message for the command, which details usage for the command
   * @type {string}
   */
  get help() {
    return this.commandHelp;
  }

  /**
   * Run the command
   * @param {message} message Message with a command to handle, reply to,
   *                          or perform an action based on parameters.
   */
  run(message) {
    message.reply('This is a basic Command')
      .then((msg) => {
        this.bot.debug(`Sent ${msg}`);
      })
      .catch((error) => {
        this.bot.error(`Error: ${error}`);
      });
  }
}

module.exports = Command;
