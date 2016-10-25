'use strict';

const Command = require('../Command.js');

class Reload extends Command {
  constructor(bot) {
    super(bot);
    this.commandId = 'genesis.reload';
    this.commandRegex = new RegExp(`^${bot.escapedPrefix}reload$`, 'ig');
    this.commandHelp = `${bot.prefix}reload          | Reloads bot commands [Owner only]`;
    this.bot = bot;
    this.md = bot.md;
    this.owner = process.env.OWNER;
  }

  get id() {
    return this.commandId;
  }

  get call() {
    return this.commandRegex;
  }

  get help() {
    return this.commandHelp;
  }

  run(message) {
    if (message.author.id === this.owner) {
      const commandsBefore = this.bot.commandHandler.commands.length;
      let commandsAfter = commandsBefore;
      this.bot.commandHandler.commands = this.bot.commandHandler.loadCommands();
      commandsAfter = this.bot.commandHandler.commands.length;
      message.reply(`${this.zSWC}${this.md.codeMulti}Commands reloaded!${this.md.blockEnd}` +
                    `${this.md.lineEnd}\`\`\`diff${this.md.lineEnd}-${commandsBefore}` +
                    `${this.md.lineEnd}+${commandsAfter}\`\`\``);
    }
  }
}

module.exports = Reload;
