'use strict';

const Command = require('../../models/Command.js');

/**
 * Restarts the bot by exiting with 27
 */
class Kill extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot The bot object
   */
  constructor(bot) {
    super(bot, 'core.kill', 'kill', 'Kill current shard', 'UTIL');
    this.ownerOnly = true;
  }

  async run() {
    this.logger.fatal('Killing bot shard');
    process.exit(255);
    return this.constructor.statuses.NO_ACCESS;
  }
}

module.exports = Kill;
