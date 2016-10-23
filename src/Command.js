'use strict';

class Command {
  constructor(bot) {
    this.commandId = 'genesis.command';
    this.commandRegex = new RegExp(`^${bot.escapedPrefix}id$`, 'ig');
    this.commandHelp = 'Prototype command';
    this.bot = bot;
    this.zSWC = '\u200B';
  }

  get id() {
    return this.commandId;
  }

  get command() {
    return this.commandRegex;
  }

  get help() {
    return this.commandHelp;
  }

  run(message) {
    message.reply('This is a basic Command')
      .then((msg) => {
        this.bot.debug(`Sent ${msg}`);
      })
      .catch((error) => {
        this.bot.error(`Error: ${error}`);
      });
  }
}

module.exports = Command;
