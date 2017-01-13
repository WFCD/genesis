'use strict';

const Command = require('../Command.js');

/**
 * Displays the currently active Invasions
 */
class Invasions extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'ondemand.invasions', 'invasion', 'Display the currently active Invasions');
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
        const invasions = ws.invasions.filter(i => !i.completed);
        const color = invasions.length > 2 ? 0x00ff00 : 0xff0000;
        const fields = invasions.map((i) => {
          let rewards = i.defenderReward.toString();
          if (!i.vsInfestation) {
            rewards = `${i.attackerReward} vs ${rewards}`;
          }

          return {
            name: `${rewards} - ${Math.round(i.completion * 100) / 100}%`,
            value: `${i.desc} on ${i.node} - ETA ${i.getETAString()}`,
          };
        });
        const embed = {
          color,
          author: {
            name: this.bot.client.user.clientID,
            icon_url: this.bot.client.user.avatarURL,
          },
          title: 'Worldstate - Invasions',
          url: 'https://warframe.com',
          description: 'Currently in-progress Invasions:',
          thumbnail: {
            url: 'https://raw.githubusercontent.com/aliasfalse/genesis/master/src/resources/invasion.png',
          },
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

module.exports = Invasions;
