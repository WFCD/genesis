'use strict';

const Command = require('../Command.js');

/**
 * Displays today's Darvo deal
 */
class Darvo extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'ondemand.darvo', 'darvo', 'Displays today\'s Darvo deal');
  }

  /**
   * Run the command
   * @param {Message} message Message with a command to handle, reply to,
   *                          or perform an action based on parameters.
   */
  run(message) {
    this.bot.settings.getChannelPlatform(message.channel)
      .then(platform => this.bot.worldStates[platform].getData())
      .then((ws) => {
        const deal = ws.dailyDeals[0];
        return message.channel.sendEmbed({
          color: 0x0000ff,
          author: {
            name: this.bot.client.user.clientID,
            icon_url: this.bot.client.user.avatarURL,
          },
          title: 'Worldstate - Darvo',
          url: 'https://warframe.com',
          description: 'Today\'s Darvo deal',
          thumbnail: {
            url: 'https://raw.githubusercontent.com/aliasfalse/genesis/master/src/resources/darvo.png',
          },
          fields: [
            {
              name: `${deal.item}, ${deal.salePrice}p - ${deal.total - deal.sold}/${deal.total} left`,
              value: `Original price: ${deal.originalPrice}p, expires in ${deal.getEtaString()}`,
            },
          ],
          footer: {
            icon_url: 'https://avatars1.githubusercontent.com/u/24436369',
            text: 'Data evaluated by warframe-wordstate-parser, Warframe Community Developers',
          },
        });
      })
      .catch(this.logger.error);
  }
}

module.exports = Darvo;
