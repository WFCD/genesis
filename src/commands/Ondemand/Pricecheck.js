'use strict';

const Command = require('../../Command.js');
const PriceCheckEmbed = require('../../embeds/PriceCheckEmbed.js');

const inProgressEmbed = { title: 'Processing search...' };

/**
 * Looks up items from Nexus-stats.com
 */
class PriceCheck extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'warframe.misc.pricecheck', 'pricecheck', 'pricecheck');
    this.regex = new RegExp('^p(?:rice)?\\s?c(?:heck)?(?:\\s+([\\w+\\s]+))?', 'i');

    this.usages = [
      {
        description: 'Display an items worth from nexus-stats.com',
        parameters: ['item'],
      },
    ];
  }

  /**
   * Run the command
   * @param {Message} message Message with a command to handle, reply to,
   *                          or perform an action based on parameters.
   */
  run(message) {
    const item = message.strippedContent.match(this.regex)[1];
    message.channel.send('', { embed: inProgressEmbed })
      .then(sentMessage => this.bot.nexusQuerier.priceCheckQueryAttachment(item)
          .then(result => ({ result, sentMessage })))
      .then(({ result, sentMessage }) => sentMessage.edit('', { embed: new PriceCheckEmbed(this.bot, result, item) }))
      .catch(this.logger.error);
  }
}

module.exports = PriceCheck;
