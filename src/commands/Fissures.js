'use strict';

const Command = require('../Command.js');

/**
 * Displays the currently active Invasions
 */
class Fissures extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'ondemand.fissures', 'fissures', 'Get the current list of Void Fissure Missions');
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
        const fissures = ws.fissures;
        const color = fissures.length > 0 ? 0x00ff00 : 0xff0000;
        const embed = {
          color,
          title: 'Worldstate - Void Fissures',
          url: 'https://warframe.com',
          description: 'Current Void Fissures',
          thumbnail: {
            url: 'https://raw.githubusercontent.com/aliasfalse/genesis/master/src/resources/voidFissure.png',
          },
          fields: [],
          footer: {
            icon_url: 'https://avatars1.githubusercontent.com/u/24436369',
            text: 'Data evaluated by warframe-wordstate-parser, Warframe Community Developers',
          },
        };
        fissures.sort((a, b) => {
          let val = 0;
          if (a.tierNum > b.tierNum) { val = 1; } else if (a.tierNum < b.tierNum) { val = -1; }
          return val;
        }).forEach((fissure) => {
          embed.fields.push({
            name: `${fissure.missionType} ${fissure.tier}`,
            value: `[${fissure.getETAString()}] ${fissure.node} against ${fissure.enemy}`,
          });
        });

        if (fissures.length === 0) {
          embed.fields.push({ name: 'Currently No Fissures', value: '' });
        }

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

module.exports = Fissures;
