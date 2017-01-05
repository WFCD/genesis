'use strict';

const Command = require('../Command.js');

/**
 * Describes the Help command
 */
class Help extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'core.help', 'help', 'Display this message');

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
