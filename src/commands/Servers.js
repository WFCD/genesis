'use strict';

const Command = require('../Command.js');

/**
 * Get a list of all servers
 */
class Servers extends Command {
  /**
   * Constructs a callable command
   * @param {Bot} bot The bot object
   */
  constructor(bot) {
    super(bot, 'core.servers', 'servers', 'Get list of bot servers in file');
    this.ownerOnly = true;
  }

  /**
   * Run the command
   * @param {Message} message Message with a command to handle, reply to,
   *                          or perform an action based on parameters.
   */
  run(message) {
    const fileContents = [];
    this.bot.client.guilds.array().forEach((guild) => {
      fileContents.push(`"${guild.name}","${guild.owner.user.username}#${guild.owner.user.discriminator}","${guild.id}"`);
    });

    message.author.sendFile(new Buffer(fileContents.join('\n'), 'ascii'), 'servers.csv');
  }
}

module.exports = Servers;
