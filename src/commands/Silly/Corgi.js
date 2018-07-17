'use strict';

const request = require('request-promise');
const Command = require('../../models/Command.js');

const options = {
  uri: 'https://dog.ceo/api/breed/corgi/cardigan/images/random',
  json: true,
};
/**
 * Corgis - Bsed on https://github.com/ryands/hubot-corgi
 */
class Corgi extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'silly.corgi', 'corgi', 'Genesis gets you a corgi');
  }

  /**
   * Run the command
   * @param {Message} message Message with a command to handle, reply to,
   *                          or perform an action based on parameters.
   * @returns {string} success status
   */
  async run(message) {
    const corgi = await request(options);
    if (corgi) {
      await this.messageManager.sendFile(message, undefined, corgi.message, `corgi.${corgi.message.split('.').pop()}`, true);
      return this.messageManager.statuses.SUCCESS;
    }
    return this.messageManager.statuses.FAILURE;
  }
}

module.exports = Corgi;
