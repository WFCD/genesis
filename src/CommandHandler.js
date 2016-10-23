'use strict';

const fs = require('fs');
const path = require('path');

class CommandHandler {
  constructor(bot) {
    this.helpMessages = [];
    this.ids = [];
    this.commandsReady = false;
    this.bot = bot;
    this.owner = process.env.OWNER;
    /**
     * The escaped prefix, for use with command regex.
     * @type {RegExp}
     */
    this.helpRegexp = new RegExp(`^${this.bot.escapedPrefix}help`, 'i');
    this.commands = [];
    this.readyCommands();
  }

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
