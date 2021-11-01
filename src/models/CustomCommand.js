'use strict';

const Command = require('./Command.js');

const URL_RE = /(https?:\/\/[^\s]+)/;

/**
 * Describes a callable command
 */
class CustomCommand extends Command {
  /**
   * Base class for custom bot commands
   * @param {Genesis} bot  The bot object
   * @param {string}  call The string that invokes this command
   * @param {string}  response What the responds to the command
   * @param {string} guildId Guild id for the guild it was created in
   */
  constructor(bot, call, response, guildId) {
    super(bot, `custom.${call}`, call, `A custom command responding ${response} to ${call}`, 'CUST_CMDS');
    this.isCustomCommand = true;
    this.response = response;
    this.guildId = guildId;
    this.regex = new RegExp(`^${this.call}`, 'i');
  }

  /**
   * Run the command
   * @param {Message} message Message with a command to handle, reply to,
   *                          or perform an action based on parameters.
   * @param {Object} ctx command context
   */
  async run(message, ctx) {
    if (!message.guild || message.guild.id !== this.guildId) return;
    let format;
    let msg = decodeURIComponent(this.response);
    const mention = message.mentions.members.size > 0
      ? message.mentions.members.first()
      : message.member;

    const isSingleImg = msg.match(URL_RE)
      && msg.match(URL_RE).length === 2
      && msg.split(' ').length === 1
      && !(msg.startsWith('<') && msg.endsWith('>'))
      && (
        msg.endsWith('.png')
        || msg.endsWith('.webp')
        || msg.endsWith('.jpg')
        || msg.endsWith('.jpeg')
        || msg.endsWith('.webm')
        || msg.endsWith('.webm')
      );

    if (isSingleImg) {
      return message.reply({ files: [msg] });
    }

    if (ctx['settings.cc.ping']) {
      const hasMtn = msg.indexOf('$mtn') > -1;
      msg = msg.replace('$mtn', mention);
      format = hasMtn ? msg : `${mention}, ${msg}`;
    } else {
      format = decodeURIComponent(this.response).replace('$mtn', `**${mention.displayName}**`);
    }
    return message.reply(format);
  }
}

module.exports = CustomCommand;
