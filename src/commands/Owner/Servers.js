'use strict';

const Command = require('../../models/Command.js');

/**
 * Get a list of all servers
 */
class Servers extends Command {
  /**
   * Constructs a callable command
   * @param {Bot} bot The bot object
   */
  constructor(bot) {
    super(bot, 'core.servers', 'servers', 'Get list of bot servers in file', 'CORE');
    this.ownerOnly = true;
  }

  /**
   * Run the command
   * @param {Message} message Message with a command to handle, reply to,
   *                          or perform an action based on parameters.
   * @returns {string} success status
   */
  async run(message) {
    const fileContents = [];
    fileContents.push('"Guild Name","Guild Owner","Guild Id","Member Count","# Human","# Bot"');
    this.bot.client.guilds.cache.array().forEach((guild) => {
      fileContents.push(`"${guild.name}","${guild.owner.user.username}#${guild.owner.user.discriminator}","${guild.id}","${guild.members.size}","${guild.members.filter(user => !user.user.bot).size}","${guild.members.filter(user => user.user.bot).size}"`);
    });

    await this.messageManager.sendFileToAuthor(message, Buffer.from(fileContents.join('\n'), 'ascii'), 'servers.csv', true);
    return this.messageManager.statuses.SUCCESS;
  }
}

module.exports = Servers;
