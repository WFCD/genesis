'use strict';

// eslint-disable-next-line no-unused-vars
const { Message } = require('discord.js');
// eslint-disable-next-line no-unused-vars
const Database = require('../settings/Database');
const BaseEmbed = require('../embeds/BaseEmbed');

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
   * @param {string}  game  Game scope to allow this command in
   */
  constructor(bot, id, call, description, game) {
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
     * @type {Array<Object>}
     */
    this.usages = [
      { description, parameters: [] },
    ];

    /**
     * Game scope in which this command is allowed.
     * @type {string}
     */
    this.game = game || 'CORE';

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
   * @param {CommandContext=} ctx command context for running command
   * @returns {Promise<string>}
   */
  // eslint-disable-next-line no-unused-vars
  async run(message, ctx) {
    const msg = await message.reply('This is a basic Command');
    this.logger.debug(`Sent ${msg}`);
    return this.messageManager.statuses.SUCCESS;
  }

  /**
   * Send Usage for a toggle command
   * @param {Message} message message to respond to
   * @param {CommandContext} ctx Context object containing common elements,
   *    such as channel settings, caller info
   * @param {Array.<string>} options optional replacement for args
   * @returns {string} failure status.
   */
  async sendToggleUsage(message, ctx, options = ['on', 'off']) {
    const embed = new BaseEmbed();
    embed.title = 'Usage';
    embed.color = 0x000ff;
    embed.description = (options && options.length) ? `Basic Usage: ${ctx.prefix}${this.call} <${options.join(' | ')}>` : undefined;
    embed.provider = {
      name: 'WFCD',
      url: 'https://github.com/WFCD',
    };

    this.usages.forEach((u) => {
      embed.addField(`${this.isInline ? '' : ctx.prefix}${this.call} ${u.parameters.map(p => `${u.delimBefore || '<'}${p}${u.delimAfter || '>'}`.trim()).join(u.separator || ' ')}`,
        u.description || 'No description', false);
    });

    embed.addField('Warning', `\`<\`, \`|\`, and \`>\` are used to delimit the beginning of parameter options, separate parameter options, and delimit the end of parameter options.
If a \`|\` is between \`<\` and \`>\`, it doesn't need to be included when calling the command.\n\u200b`);

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
      game: this.game,
    };
  }
}

module.exports = Command;
