'use strict';

const fs = require('fs');
const path = require('path');

const decache = require('decache');

/**
 * Describes a CommandHandler for a bot.
 */
class CommandHandler {
  /**
   * Constructs CommandHandler
   * @param {Genesis} bot    Bot to derive prefix for commands from
   */
  constructor(bot) {
    this.bot = bot;
    this.logger = bot.logger;

    /**
     * Array of command objects that can be called
     * @type {Array<Command>}
     * @private
     */
    this.commands = [];
  }

  /**
   * Loads the commands from disk into this.commands
   */
  loadCommands() {
    const commandDir = path.join(__dirname, 'commands');
    const files = fs.readdirSync(commandDir);

    if (this.commands.length !== 0) {
      this.logger.debug('Decaching commands');
      files.forEach((f) => {
        decache(`${commandDir}/${f}`);
      });
    }

    this.logger.debug(`Loading commands: ${files}`);

    this.commands = files.map((f) => {
      try {
        // eslint-disable-next-line import/no-dynamic-require, global-require
        const Cmd = require(`${commandDir}/${f}`);
        const command = new Cmd(this.bot);

        this.logger.debug(`Adding ${command.id}`);
        return command;
      } catch (err) {
        this.logger.error(err);
        return null;
      }
    })
      .filter(c => c !== null);
  }

  /**
   * Handle the command contained in the message contents, if any.
   * @param {Message} message Message whose command should be checked and handled
   */
  handleCommand(message) {
    this.logger.debug(`Handling \`${message.content}\``);
    this.commands.forEach((command) => {
      if (command.regex.test(message.content)) {
        if (this.checkCanAct(command, message.author)) {
          this.logger.debug(`Matched ${command.id}`);
          message.react('\u2705').catch(this.logger.error);
          command.run(message);
        }
      }
    });
  }

  /**
   * Check if the current command being called is able to be performed for the user calling it.
   * @param   {Command} command  command to process to see if it can be called
   * @param   {User} author caller of the message, the author.
   * @returns {boolean} Whether or not the ucrrent command can be called by the author
   */
  checkCanAct(command, author) {
    if (command.ownerOnly && author.id !== this.bot.owner) {
      return false;
    }
    // TODO: Do blacklist checking
    return true;
  }
}

module.exports = CommandHandler;
