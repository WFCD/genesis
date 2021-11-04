'use strict';

const Command = require('../../models/Command.js');

/**
 * Restarts the bot by exiting with 0
 */
class Restart extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot The bot object
   */
  constructor(bot) {
    super(bot, 'core.restart', 'restart', 'Restart bot', 'CORE');
    this.ownerOnly = true;
    this.blacklistable = false;
  }

  async run() {
    this.logger.debug('Forcing Restart');
    process.exit(0);
    return this.constructor.statuses.NO_ACCESS;
  }
}

module.exports = Restart;
