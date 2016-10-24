'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Describes a CommandHandler for a bot.
 */
class CommandHandler {
  /**
   * Constructs CommandHandler
   * @param {Object} bot Bot to get parameters from for prefix and readiness
   */
  constructor(bot) {
    /**
     * Whether or not the commands for this handler are ready to be called.
     * @type {boolean}
     * @private
     */
    this.commandsReady = false;
    /**
     * The bot that this CommandHandler operates for
     * @type {Genesis}
     * @private
     */
    this.bot = bot;

    /**
     * The id of the owner of the bot for permissions
     * @type {string}
     * @private
     */
    this.owner = process.env.OWNER;

    /**
     * Array of command objects that can be called
     * @type {Array<Command>}
     * @private
     */
    this.commands = [];
    this.readyCommands();
  }

  /**
   * Prepare the commands from the `commands` directory.
   */
  readyCommands() {
    this.commandsReady = false;
    this.commands.length = 0;
    const commandDir = path.join(__dirname, 'commands');
    const files = fs.readdirSync(commandDir);
    this.bot.debug(files);
    this.commands = files.map((f) => {
      // eslint-disable-next-line import/no-dynamic-require, global-require
      const Cmd = require(`${commandDir}/${f}`);
      const command = new Cmd(this.bot);
      this.bot.debug(`Adding ${command.id}`);
      return command;
    });
    this.commandsReady = true;
  }

  /**
   * Handle the command contained in the message contents, if any.
   *
   * @param {Message} message Message whose command should be checked and handled
   */
  handleCommand(message) {
    if (this.commandsReady) {
      this.bot.debug(`Handling \`${message.content}\``);
      this.commands.forEach((command) => {
        if (command.command.test(message.content)) {
          if (this.checkCanAct(command, message.author)) {
            this.bot.debug(`Matched ${command.id}`);
            command.run(message);
          }
        }
      });
    }
  }

  /**
   * Check if the current command being called is able to be performed for the user calling it.
   * @param   {Command} command  command to process to see if it can be called
   * @param   {string} authorId caller of the message, the author.
   * @returns {boolean} Whether or not the ucrrent command can be called by the author
   */
  checkCanAct(command, authorId) {
    let canAct = false;
    if (this.owner === authorId) {
      canAct = this.bot.readyToExecute && this.commandsReady;
    } else {
      // TODO: Do blacklist checking
      canAct = this.bot.readyToExecute && this.commandsReady;
    }
    return canAct;
  }
}

module.exports = CommandHandler;
