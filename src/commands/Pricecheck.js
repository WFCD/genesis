'use strict';

const Nexus = require('warframe-nexus-query');
const Command = require('../Command.js');

/**
 * Looks up items from Nexus-stats.com
 */
class PriceCheck extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'misc.pricecheck', 'pricecheck', 'pricecheck');
    this.regex = new RegExp(`^${this.bot.escapedPrefix}p(?:rice)?\\s?c(?:heck)?(?:\\s+([\\w+\\s]+))?`, 'i');

    this.usages = [
      {
        description: 'Display an items worth from nexus-stats.com',
        parameters: ['item'],
      },
    ];

    this.nexusQuerier = new Nexus();
  }

  /**
   * Run the command
   * @param {Message} message Message with a command to handle, reply to,
   *                          or perform an action based on parameters.
   */
  run(message) {
    try {
      const item = message.content.match(this.regex)[1];

      this.nexusQuerier.priceCheckQueryAttachment(item)
        .then((result) => {
          if (typeof result[0] === 'string') {
            const embed = {
              color: 0xff0000,
              title: 'Warframe - Pricecheck',
              url: 'http://nexus-stats.com',
              description: `Pricecheck for: ${item}`,
              thumbnail: {
                url: 'https://cdn.discordapp.com/icons/195582152849620992/4c1fbd47b3e6c8d49b6d2362c79a537b.jpg',
              },
              fields: [
                {
                  name: '_ _',
                  value: result[0],
                  inline: true,
                },
              ],
              footer: {
                icon_url: 'https://cdn.discordapp.com/icons/195582152849620992/4c1fbd47b3e6c8d49b6d2362c79a537b.jpg',
                text: 'Pricechecks provided by Nexus Stats - https://nexus-stats.com',
              },
            };
            message.channel.sendMessage('', { embed }).catch(this.logger.error);
          } else {
            const attachment = result[0];
            const embed = {
              description: `Location query for ${item}`,
              type: attachment.type,
              title: attachment.title,
              url: attachment.url,
              fields: attachment.fields,
              thumbnail: attachment.thumbnail,
              footer: attachment.footer,
            };
            message.channel.sendMessage('', { embed }).catch(this.logger.error);
          }
        })
        .catch(this.bot.logger.error);
    } catch (e) {
      this.logger.error(e);
    }
  }
}

module.exports = PriceCheck;
