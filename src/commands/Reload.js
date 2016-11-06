'use strict';

const Command = require('../Command.js');
const md = require('node-md-config');

class Reload extends Command {
  /**
   * Constructs a callable command
   * @param  {Logger}           logger                The logger object
   * @param  {string}           [options.prefix]      Prefix for calling the bot
   * @param  {string}           [options.regexPrefix] Escaped prefix for regex for the command
   * @param  {MarkdownSettings} [options.mdConfig]    The markdown settings
   */
  // eslint-disable-next-line no-useless-escape
  constructor(logger, { mdConfig = md, regexPrefix = '\/', prefix = '/', commandHandler = null } = {}) {
    super(logger, { mdConfig, regexPrefix, prefix });
    this.commandId = 'genesis.reload';
    this.commandRegex = new RegExp(`^${regexPrefix}reload$`, 'ig');
    this.commandHelp = `${prefix}reload          | Reloads bot commands [Owner only]`;
    this.commandHandler = commandHandler;
    this.owner = process.env.OWNER;
  }

  run(message) {
    if (message.author.id === this.owner) {
      const commandsBefore = this.commandHandler.commands.length;
      this.commandHandler.commands = this.commandHandler.loadCommands();
      const commandsAfter = this.commandHandler.commands.length;
      message.reply(`${this.zSWC}${this.md.codeMulti}Commands reloaded!${this.md.blockEnd}` +
                    `${this.md.lineEnd}\`\`\`diff${this.md.lineEnd}-${commandsBefore}` +
                    `${this.md.lineEnd}+${commandsAfter}\`\`\``);
    }
  }
}

module.exports = Reload;
