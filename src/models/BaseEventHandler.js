'use strict';

// eslint-disable-next-line no-unused-vars
const Discord = require('discord.js');

/**
 * Describes a handler
 */
class BaseEventHandler {
  static deferred = false;

  /**
   * Base class for bot commands
   * @param {Genesis} bot  The bot object
   * @param {string}  id   The command's unique id
   * @param {string}  event Event to trigger this handler
   */
  constructor(bot, id, event) {
    /**
     * Handler Identifier
     * @type {string}
     */
    this.id = id;

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
     * Event to be triggerd by this handler
     * @type {string}
     */
    this.event = event;

    /**
     * Message manager
     * @type {MessageManager}
     */
    this.messageManager = bot.messageManager;

    /**
     * Database settings wrapper
     * @type {Database}
     */
    this.settings = bot.settings;

    /**
     * The bot client
     * @type {Discord.Client}
     */
    this.client = bot.client;
  }

  /**
   * Run the handle
   * @param {GuildMember|Guild|User|Interaction} event Event param to handle
   * @param {GuildMember|Guild|User|Interaction} event2 Second event param to handle
   */
  async execute(event, event2) {
    this.logger.debug(`Handled ${event} & ${event2}`);
  }
}

module.exports = BaseEventHandler;
