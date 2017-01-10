'use strict';

const Command = require('../Command.js');

/**
 * Displays the currently active Invasions
 */
class VoidTrader extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'ondemand.voidtrader', 'trader', 'Display the currentstatus of the void trader');
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
        const voidTrader = ws.voidTrader;
        const color = voidTrader.isActive() ? 0x00ff00 : 0xff0000;
        const embed = {
          color,
          title: 'Worldstate - VoidTrader',
          url: 'https://warframe.com',
          description: 'Current Void Trader Status:',
          thumbnail: {
            url: 'https://raw.githubusercontent.com/aliasfalse/genesis/master/src/resources/voidtrader.png',
          },
          fields: [],
          footer: {
            icon_url: 'https://avatars1.githubusercontent.com/u/24436369',
            text: 'Data evaluated by warframe-wordstate-parser, Warframe Community Developers',
          },
        };
        if (voidTrader.isActive()) {
          voidTrader.inventory.forEach((invItem) => {
            embed.fields.push({ name: invItem.name, value: `${invItem.ducats} ducats + ${invItem.credits}cr` });
          });
        }

        embed.fields.push({ name: `Time until ${voidTrader.isActive() ? 'departure' : 'arrival'}`, value: `${voidTrader.isActive() ? voidTrader.getEndString() : voidTrader.getStartString()}` });

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

module.exports = VoidTrader;
