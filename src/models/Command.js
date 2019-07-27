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
     * The command manager for processing commands
     * @type {CommandManager}
     */
    this.commandManager = bot.commandManager;

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

    /**
     * Settings object interface
     * @type {Database}
     */
    this.settings = bot.settings;

    this.platforms = ['pc', 'ps4', 'xb1'];

    this.delimBegin = '<';
    this.delimEnd = '>';

    if (bot.path) {
      this.path = bot.path;
    }

    /**
     * Hard value to toggle a command off from code
     * @type {Boolean}
     */
    this.enabled = true;

    /**
     * Bot Worldstate Client
     * @type {WorldStateClient}
     */
    this.ws = bot.ws;
  }

  /**
   * Run the command
   * @param {Message} message Message with a command to handle, reply to,
   *                          or perform an action based on parameters.
   */
  async run(message) {
    const msg = await message.reply('This is a basic Command');
    this.logger.debug(`Sent ${msg}`);
  }

  /**
   * Send Usage for a toggle command
   * @param {Discord.Message} message message to respond to
   * @param {Array.<string>} options optional replacement for args
   * @returns {string} failure status.
   */
  async sendToggleUsage(message, options = ['on', 'off']) {
    const embed = {
      title: 'Usage',
      type: 'rich',
      color: 0x0000ff,
      fields: [
        {
          name: `${this.bot.prefix}${this.call} <${options.join(' | ')}>`,
          value: '\u200B',
        },
      ],
    };
    this.messageManager.embed(message, embed, true, true);
    return this.messageManager.statuses.FAILURE;
  }

  manifest() {
    return {
      id: this.id,
      call: this.call,
      delimiters: {
        begin: this.delimBegin,
        end: this.delimEnd,
      },
      isCustomCommand: this.isCustomCommand,
      isInline: this.isInline,
      ownerOnly: this.ownerOnly,
      allowInline: this.allowInline,
      allowDM: this.allowDM,
      requiresAuth: this.requiresAuth,
      regex: {
        flags: this.regex.flags,
        body: this.regex.toString().replace(new RegExp(`/${this.regex.flags}$`, 'ig'), '').replace(new RegExp('^/', 'ig'), ''),
      },
      path: this.path,
      usages: this.usages,
      blacklistable: this.blacklistable,
      enabled: this.enabled,
    };
  }
}

module.exports = Command;
