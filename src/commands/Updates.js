'use strict';

const Command = require('../Command.js');

/**
 * Displays the currently active Warframe update news
 */
class Updates extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'ondemand.updates', 'updates', 'Display the currently active update news');
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
        const news = ws.news.filter(n => n.isUpdate());
        const color = news.length > 0 ? 0x00ff00 : 0xff0000;
        const value = news.map(n => n.toString()).join('\n');
        const fields = [{ name: 'Current updates:', value: value.length > 0 ? value : 'No Update News Currently' }];
        const embed = {
          color,
          author: {
            name: this.bot.client.user.clientID,
            icon_url: this.bot.client.user.avatarURL,
          },
          title: 'Worldstate - Updates',
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

module.exports = Updates;
