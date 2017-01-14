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

    this.helpEmbed = null;

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
    if (!this.helpEmbed) {
      this.makeHelpEmbed();
    }
    if (message.channel.type !== 'dm') {
      message.reply(this.helpReplyMsg)
        .then((reply) => {
          if (reply.deletable) {
            reply.delete(10000);
          }
        }).catch(this.logger.error);
    }

    message.author.sendEmbed(this.helpEmbed).then(() => {
      if (message.deletable) {
        message.delete(2000);
      }
    }).catch(this.logger.error);
  }

  makeHelpEmbed() {
    this.helpEmbed = {
      type: 'rich',
      thumbnail: {
        url: 'https://github.com/aliasfalse/genesis/raw/master/src/resources/cephalontransparent.png',
      },
    };

    const commands = this.commandHandler.commands.filter(c => !c.ownerOnly)
      .map(c => c.usages.map(u => ({
        name: `${this.bot.prefix}${c.call} ${u.parameters.map(p => `<${p}>`).join(' ')}`,
        value: u.description,
        inline: false,
      }
    )));

    this.helpEmbed.fields = [].concat(...commands);
  }
}

module.exports = Help;
