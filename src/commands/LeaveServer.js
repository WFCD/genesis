'use strict';

const Command = require('../Command.js');

/**
 * Leaves a server.
 */
class LeaveServer extends Command {
  /**
   * Constructs a callable command
   * @param {Bot} bot The bot object
   */
  constructor(bot) {
    super(bot, 'core.leaveserver', 'leaveserver', 'Leave a specified server');
    this.ownerOnly = true;
    this.regex = new RegExp(`^${this.bot.escapedPrefix}${this.call}\\s*(.*)?`, 'i');
    this.usages = [
      {
        description: 'Tell the bot to leave a server, if it\'s cached',
        parameters: ['server id'],
      },
    ];
  }

  /**
   * Run the command
   * @param {Message} message Message with a command to handle, reply to,
   *                          or perform an action based on parameters.
   */
  run(message) {
    const serverid = message.cleanContent.match(this.regex)[1];
    if (this.bot.client.guilds.has(serverid)) {
      this.bot.client.guilds.get(serverid).leave()
        .then(guild => message.reply(`Left ${guild.name}`))
        .catch(this.logger.error);
    } else {
      message.reply('No such guild cached');
    }
  }
}

module.exports = LeaveServer;
