'use strict';

/**
 * Describes a handler
 */
class BaseEventHandler {
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
     * @type {[type]}
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
   * @param {GuildMember|Guild|User} event Event param to handle
   * @param {GuildMember|Guild|User} event2 Second event param to handle
   */
  async execute(event, event2) {
    this.logger.debug(`Handled ${event} & ${event2}`);
  }
}

module.exports = BaseEventHandler;
