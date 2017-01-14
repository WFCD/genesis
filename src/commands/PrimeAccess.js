'use strict';

const Command = require('../Command.js');

/**
 * Displays the currently active warframe prime access news
 */
class PrimeAccess extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'ondemand.primeaccess', 'primeaccess', 'Display the currently active prime access news');
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
        const news = ws.news.filter(n => n.isPrimeAccess());
        const color = news.length > 0 ? 0x00ff00 : 0xff0000;
        const value = news.map(n => n.toString()).join('\n');
        const fields = [{ name: 'Current prime access:', value: value.length > 0 ? value : 'No Prime Access Currently' }];
        const embed = {
          color,
          author: {
            name: this.bot.client.user.clientID,
            icon_url: this.bot.client.user.avatarURL,
          },
          title: 'Worldstate - Prime Access',
          url: 'https://warframe.com',
          fields,
          footer: {
            icon_url: 'https://avatars1.githubusercontent.com/u/24436369',
            text: 'Data evaluated by warframe-wordstate-parser, Warframe Community Developers',
          },
        };
        return message.channel.sendEmbed(embed);
      }).then(() => {
        if (message.deletable) {
          return message.delete(2000);
        }
        return Promise.resolve();
      })
      .catch(this.logger.error);
  }
}

module.exports = PrimeAccess;
