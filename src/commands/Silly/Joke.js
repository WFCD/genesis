'use strict';

// eslint-disable-next-line no-unused-vars
const { Message } = require('discord.js');
const { jokes } = require('../../interactions/fun/Joke');

/**
 * Tell a joke
 */
module.exports = class Jokes extends require('../../models/Command.js') {
  /**
   * Constructs a callable command
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'silly.joke', 'joke', 'Genesis tells a joke', 'FUN');
  }

  async run(message) {
    await message.reply(`\`\`\`haskell\n${jokes[Math.floor(Math.random() * jokes.length)]}\n\`\`\``);
    return this.messageManager.statuses.SUCCESS;
  }
};
