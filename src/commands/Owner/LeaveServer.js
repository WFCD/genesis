'use strict';

const Command = require('../../models/Command.js');

/**
 * Leaves a server.
 */
class LeaveServer extends Command {
  /**
   * Constructs a callable command
   * @param {Bot} bot The bot object
   */
  constructor(bot) {
    super(bot, 'core.leaveserver', 'leaveserver', 'Leave a specified server', 'CORE');
    this.ownerOnly = true;
    this.regex = new RegExp(`^${this.call}\\s*(.*)?`, 'i');
    this.usages = [
      {
        description: 'Tell the bot to leave a server, if it\'s cached',
        parameters: ['server id'],
      },
    ];
  }

  async run(message) {
    const serverid = message.strippedContent.match(this.regex)[1];
    if (this.bot.client.guilds.cache.has(serverid)) {
      const guild = await this.bot.client.guilds.cache.get(serverid).leave();
      this.messageManager.reply(message, `Left ${guild.name}`, true, true);
      return this.messageManager.statuses.SUCCESS;
    }
    message.reply('No such guild cached');
    return this.messageManager.statuses.FAILURE;
  }
}

module.exports = LeaveServer;
