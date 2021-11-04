'use strict';

// eslint-disable-next-line no-unused-vars
const Discord = require('discord.js');
const fetch = require('../../resources/Fetcher');
const Command = require('../../models/Command.js');

/**
 * Corgis - Bsed on https://github.com/ryands/hubot-corgi
 */
class Corgi extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'silly.corgi', 'corgi', 'Genesis gets you a corgi', 'FUN');
  }

  /**
   * Run the command
   * @param {Discord.Message} message Message with a command to handle, reply to,
   *                          or perform an action based on parameters.
   * @returns {string} success status
   */
  async run(message) {
    const corgi = await fetch('https://dog.ceo/api/breed/corgi/cardigan/images/random');
    if (corgi) {
      await message.reply({
        files: [{
          attachment: corgi.message,
          name: `corgi.${corgi.message.split('.').pop()}`,
        }],
      });
      return this.constructor.statuses.SUCCESS;
    }
    return this.constructor.statuses.FAILURE;
  }
}

module.exports = Corgi;
