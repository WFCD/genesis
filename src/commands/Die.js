'use strict';

const Command = require('../Command.js');
const md = require('node-md-config');

/**
 * Describes the Armor command
 */
class Die extends Command {
  /**
   * Constructs a callable command
   * @param  {Logger}           logger                The logger object
   * @param  {string}           [options.prefix]      Prefix for calling the bot
   * @param  {string}           [options.regexPrefix] Escaped prefix for regex for the command
   * @param  {MarkdownSettings} [options.mdConfig]    The markdown settings
   */
  // eslint-disable-next-line no-useless-escape
  constructor(logger, { mdConfig = md, regexPrefix = '\/', prefix = '/' } = {}) {
    super(logger, { mdConfig, regexPrefix, prefix });
    this.commandId = 'core.die';
    // eslint-disable-next-line no-useless-escape
    this.commandRegex = new RegExp(`^${regexPrefix}die$`, 'i');
    this.commandHelp = `${prefix}die             | Turns bot off [Owner only]`;
    this.logger = logger;
    this.blacklistable = false;
    this.ownerOnly = true;
    this.requiresAuth = true;
  }

  run(message) {
    message.reply('Goodbye, Operator. I hope you think better of me someday.')
      .then((msg) => {
        msg.delete(10000);
        this.logger.debug('i\'m goin down');
        process.exit(1);
      })
      .catch(this.logger.error);
  }
}

module.exports = Die;
