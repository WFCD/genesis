'use strict';

const Command = require('../../Command.js');
const PriceCheckEmbed = require('../../embeds/PriceCheckEmbed.js');
const request = require('request-promise');

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
   * @returns {string} success status
   */
  async run(message) {
    try {
      const item = message.strippedContent.match(this.regex)[1];
      const sentMessage = await message.channel.send('', { embed: inProgressEmbed });
      const options = {
        uri: `https://api.warframestat.us/pricecheck/attachment/${item}`,
        json: true,
        rejectUnauthorized: false,
      };
      const result = await request(options);
      const embed = new PriceCheckEmbed(this.bot, result, item);
      sentMessage.edit('', { embed });
      return embed.color === 0xff55ff ?
        this.messageManager.statuses.FAILURE : this.messageManager.statuses.SUCCESS;
    } catch (error) {
      this.logger.error(error);
      return this.messageManager.statuses.FAILURE;
    }
  }
}

module.exports = PriceCheck;
