'use strict';

const Command = require('../Command.js');

/**
 * Displays the currently active Invasions
 */
class Sorties extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'ondemand.sorties', 'sortie', 'Display the currently active sorties');
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
        const sortie = ws.sortie;
        if (sortie.isExpired()) {
          return message.channel.sendMessage('There is currently no sortie');
        }

        const variantFields = sortie.variants.map(v => ({
          name: `${v.node} - ${v.missionType}`,
          value: `${v.modifier}`,
        }));

        const embed = {
          color: 0x00ff00,
          author: {
            name: this.bot.client.user.clientID,
            icon_url: this.bot.client.user.avatarURL,
          },
          title: 'Worldstate - Sortie',
          url: 'https://warframe.com',
          description: `Currently in-progress sortie: **${sortie.getBoss()}**`,
          thumbnail: {
            url: 'http://i.imgur.com/wWBRhaB.png',
          },
          fields: [
            ...variantFields,
            {
              name: '_ _',
              value: `Ends in ${sortie.getETAString()}`,
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

module.exports = Sorties;
