'use strict';

const Command = require('../Command.js');

/**
 * Describes the Help command
 */
class Help extends Command {

  /**
   * Constructs a Help command
   * @param {Object} bot Bot to pull settings from
   */
  constructor(bot) {
    super(bot);
    this.commandId = 'genesis.help';
    this.commandRegex = new RegExp(`^${bot.escapedPrefix}help(.*)`, 'ig');
    this.commandHelp = `${bot.prefix}help            | Display this message`;
    this.md = bot.md;
    this.bot = bot;
    this.helpOut = '';

    /**
     * Help reply messsage for alerting a user to check their direct messages.
     * @type {string}
     * @private
     */
    this.helpReplyMsg = process.env.HELP_REPLY || ' check your direct messages for help.';
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

  /**
   * Send help message
   * @param {Message} message Message to reply to
   */
  run(message) {
    if (this.helpOut === '') {
      this.helpOut += `${this.zSWC}${this.md.codeMulti}`;
      this.bot.commandHandler.commands.forEach((command) => {
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
      .catch(this.errorHandle);
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
      .catch(this.errorHandle);
  }
}

module.exports = Help;
