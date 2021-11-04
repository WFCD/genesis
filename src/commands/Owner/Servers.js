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
    super(bot, 'core.servers', 'servers', 'Get list of bot servers in file', 'BOT_MGMT');
    this.ownerOnly = true;
  }

  async run(message) {
    const fileContents = [];
    fileContents.push('"Guild Name","Guild Owner","Guild Id","Member Count","# Human","# Bot"');
    this.bot.client.guilds.cache.array().forEach((guild) => {
      fileContents.push(`"${guild.name}","${guild.owner.user.username}#${guild.owner.user.discriminator}","${guild.id}","${guild.members.size}","${guild.members.filter(user => !user.user.bot).size}","${guild.members.filter(user => user.user.bot).size}"`);
    });

    await message.author.send({
      files: [{
        name: 'servers.csv',
        attachment: Buffer.from(fileContents.join('\n'), 'ascii'),
      }],
    });
    return this.constructor.statuses.SUCCESS;
  }
}

module.exports = Servers;
