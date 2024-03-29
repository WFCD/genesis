/**
 * Describes a handler
 */
export default class BaseEventHandler {
  static deferred = false;

  /**
   * Base class for bot commands
   * @param {Genesis?} bot  The bot object
   * @param {string?}  id   The command's unique id
   * @param {string?}  event Event to trigger this handler
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
     * Database settings wrapper
     * @type {Database}
     * @instance
     */
    this.settings = bot.settings;

    /**
     * The bot client
     * @type {module:"discord.js".Client}
     */
    this.client = bot.client;
  }

  /**
   * Run the handle
   * @param {*?} event Event param to handle
   */
  async execute(event) {
    this.logger.debug(`Handled ${event}`);
  }
}
