'use strict';

const md = require('node-md-config');

/**
 * Describes a callable command
 */
class Command {
  /**
   * Constructs a callable command
   * @param  {Logger}           logger                   The logger object
   * @param  {string}           [options.prefix]         Prefix for calling the bot
   * @param  {string}           [options.regexPrefix]    Escaped prefix for regex for the command
   * @param  {MarkdownSettings} [options.mdConfig]       The markdown settings
   * @param  {CommandHandler}   [options.commandHandler] Command handler for
   *                                                     handling commands for a bot
   */
  // eslint-disable-next-line no-useless-escape
  constructor(logger, { mdConfig = md, regexPrefix = '\/', prefix = '/', commandHandler = null } = {}) {
    /**
     * Command Identifier
     * @type {string}
     */
    this.commandId = 'genesis.command';
    /**
     * Command regex for calling the command
     * @type {RegExp}
     */
    this.commandRegex = new RegExp(`^${regexPrefix}id$`, 'ig');
    /**
     * Help command for documenting the function or purpose of a command.
     * @type {string}
     */
    this.commandHelp = `${prefix} id | Prototype command`;

    /**
     * The logger object
     * @type {Logger}
     * @private
     */
    this.logger = logger;

    /**
     * The markdown settings
     * @type {MarkdownSettings}
     * @private
     */
    this.md = mdConfig;

    /**
     * Zero space whitespace character to prepend to any messages sent
     * to prevent a command from inadvertantly being triggered.
     * @type {string}
     */
    this.zSWC = '\u200B';

    /**
     * The command handler for processing commands
     * @type {CommandHandler}
     */
    this.commandHandler = commandHandler;
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
   * @param {Message} message Message with a command to handle, reply to,
   *                          or perform an action based on parameters.
   */
  run(message) {
    message.reply('This is a basic Command')
      .then((msg) => {
        this.logger.debug(`Sent ${msg}`);
      })
      .catch((error) => {
        this.logger.error(`Error: ${error}`);
      });
  }
}

module.exports = Command;
