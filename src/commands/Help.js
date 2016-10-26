'use strict';

const Command = require('../Command.js');
const md = require('node-md-config');

/**
 * Describes the Help command
 */
class Help extends Command {
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
    this.commandId = 'genesis.help';
    this.commandRegex = new RegExp(`^${regexPrefix}help(.*)`, 'ig');
    this.commandHelp = `${prefix}help            | Display this message`;
    this.commandHandler = commandHandler;
    this.helpOut = '';

    /**
     * Help reply messsage for alerting a user to check their direct messages.
     * @type {string}
     * @private
     */
    this.helpReplyMsg = process.env.HELP_REPLY || ' check your direct messages for help.';
  }

  /**
   * Send help message
   * @param {Message} message Message to reply to
   */
  run(message) {
    if (this.helpOut === '') {
      this.helpOut += `${this.zSWC}${this.md.codeMulti}`;
      this.commandHandler.commands.forEach((command) => {
        this.helpOut += `${command.help}${this.md.lineEnd}`;
      });
      this.helpOut += this.md.blockEnd;
    }
    if (message.channel.type !== 'dm') {
      message.reply(this.helpReplyMsg)
      .then((msg) => {
        if (msg.deletable) {
          msg.delete(10000);
        }
      })
      .catch(this.logger.error);
    }

    message.author.sendMessage(this.helpOut)
      .then((msg) => {
        if (msg.deletable) {
          msg.delete(100000);
        }
        if (message.deletable) {
          message.delete(100000);
        }
      })
      .catch(this.logger.error);
  }
}

module.exports = Help;
