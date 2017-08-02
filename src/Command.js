'use strict';

/**
 * Options for a command
 * @typedef  {Object} CommandOptions
 * @property {string} prefix                     - Prefix for the command
 * @property {string} regexPrefix                - Escaped prefix for use in regular expressions
 * @property {CommandHandler} commandHandler     - The bot's command handler
 * @property {MarkdownSettings} markdownSettings - Markdown settings
 */

/**
 * Describes a callable command
 */
class Command {
  /**
   * Base class for bot commands
   * @param {Genesis} bot  The bot object
   * @param {string}  id   The command's unique id
   * @param {string}  call The string that invokes this command
   * @param {string}  description A description for this command
   */
  constructor(bot, id, call, description) {
    /**
     * Command Identifier
     * @type {string}
     */
    this.id = id;
    this.call = call;
    /**
     * Command regex for calling the command
     * @type {RegExp}
     */
    this.regex = new RegExp(`^${call}s?$`, 'i');
    /**
     * Help command for documenting the function or purpose of a command.
     * @type {string}
     */
    this.usages = [
      { description, parameters: [] },
    ];

    /**
     * The logger object
     * @type {Logger}
     * @private
     */
    this.logger = bot.logger;

    /**
     * The bot object
     * @type {Genesis}
     */
    this.bot = bot;

    /**
     * The markdown settings
     * @type {MarkdownSettings}
     * @private
     */
    this.md = bot.md;

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
    this.commandHandler = bot.commandHandler;

    /**
     * True if the command may only be executed by the owner of the bot
     * @type {boolean}
     */
    this.ownerOnly = false;

    /**
     * True if this command is allowed to be disabled.
     * @type {Boolean}
     */
    this.blacklistable = true;

    /**
     * True if this command requires authorization to be executed
     * @type {Boolean}
     */
    this.requiresAuth = false;

   /**
    * True if this command is allowed in direct messages
    * @type {Boolean}
    */
    this.allowDM = true;

    /**
     * True if this is an inline command
     * @type {Boolean}
     */
    this.isInline = false;

    /**
     * True if command is a custom command
     * @type {Boolean}
     */
    this.isCustomCommand = false;

    /**
     * Message manager for sending and managing messages
     * @type {MessageManager}
     */
    this.messageManager = bot.messageManager;
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
