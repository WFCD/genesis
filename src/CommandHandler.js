'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Describes a CommandHandler for a bot.
 */
class CommandHandler {
  /**
   * Constructs CommandHandler
   * @param {Logger}  logger Simple logging class for logging errors and debugging
   * @param {Genesis} bot    Bot to derive prefix for commands from
   */
  constructor(logger, bot) {
    /**
     * Simple logging class for logging errors and debugging
     * @type {Logger}
     * @private
     */
    this.logger = logger;

    this.bot = bot;

    /**
     * Array of command objects that can be called
     * @type {Array<Command>}
     * @private
     */
    this.commands = this.loadCommands();
  }

  /**
   * Prepare the commands from the `commands` directory.
   * @returns {Array.<Command>} The loaded commands
   */
  loadCommands() {
    const commandDir = path.join(__dirname, 'commands');
    const files = fs.readdirSync(commandDir);
    this.logger.debug(`Loading commands: ${files}`);

    return files.map((f) => {
      let command;
      try {
        // eslint-disable-next-line import/no-dynamic-require, global-require
        const Cmd = require(`${commandDir}/${f}`);
        command = new Cmd(this.logger, {
          prefix: this.bot.prefix,
          regexPrefix: this.bot.escapedPrefix,
          commandHandler: this,
        });
      } catch (err) {
        this.logger.error(err);
        return null;
      }
      this.logger.debug(`Adding ${command.id}`);
      return command;
    });
  }

  /**
   * Handle the command contained in the message contents, if any.
   *
   * @param {Message} message Message whose command should be checked and handled
   */
  handleCommand(message) {
    this.logger.debug(`Handling \`${message.content}\``);
    this.commands.forEach((command) => {
      if (command.call.test(message.content)) {
        if (this.checkCanAct(command, message.author)) {
          this.logger.debug(`Matched ${command.id}`);
          command.run(message);
        }
      }
    });
  }

  /**
   * Check if the current command being called is able to be performed for the user calling it.
   * @param   {Command} command  command to process to see if it can be called
   * @param   {string} authorId caller of the message, the author.
   * @returns {boolean} Whether or not the ucrrent command can be called by the author
   */
  checkCanAct(command, authorId) {
    if (this.owner === authorId) {
      return true;
    }
    // TODO: Do blacklist checking
    return true;
  }
}

module.exports = CommandHandler;
