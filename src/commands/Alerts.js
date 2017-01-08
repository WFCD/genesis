'use strict';

const Command = require('../Command.js');

/**
 * Displays the currently active alerts
 */
class Alerts extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'ondemand.alerts', 'alerts', 'Display the currently active alerts');
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
        const alerts = ws.alerts.filter(a => !a.getExpired());
        const color = alerts.length > 2 ? 0x00ff00 : 0xff0000;
        const embed = {
          color,
          author: {
            name: this.bot.client.user.clientID,
            icon_url: this.bot.client.user.avatarURL,
          },
          title: 'Worldstate - Alerts',
          url: 'https://warframe.com',
          description: 'Currently in-progress alerts:',
          thumbnail: {
            url: 'http://i.imgur.com/KQ7f9l7.png',
          },
          fields: [
            {
              name: '_ _',
              value: alerts.map(a => a.toString()).join(''),
            },
          ],
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

module.exports = Alerts;
