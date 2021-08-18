'use strict';

const ServerInfoEmbed = require('../../embeds/ServerInfoEmbed');
/**
 * Get a list of all servers
 */
class ServerInfo extends require('../../models/Command.js') {
  /**
   * Constructs a callable command
   * @param {Bot} bot The bot object
   */
  constructor(bot) {
    super(bot, 'util.serverInfo', 'serverinfo', 'Get info about current server', 'UTIL');
  }

  async run(message) {
    const { guild } = message;
    if (!guild) {
      await message.reply('Operator, this is a DM, you can\'t do that!');
      return this.messageManager.statuses.FAILURE;
    }
    const embed = new ServerInfoEmbed(this.bot, guild);
    await message.reply({ embeds: [embed] });
    return this.messageManager.statuses.SUCCESS;
  }
}

module.exports = ServerInfo;
