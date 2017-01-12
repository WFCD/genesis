'use strict';

const Command = require('../Command.js');

function shieldCalc(baseShields, baseLevel, currentLevel) {
  return (parseFloat(baseShields) +
    (((parseFloat(currentLevel) - parseFloat(baseLevel)) ** 2)
    * 0.0075 * parseFloat(baseShields))).toFixed(2);
}

function shieldString(shields, level) {
  return `At level ${parseFloat(level).toFixed(0)}, your enemy would have ${shields} Shields.`;
}

/**
 * Performs shield calculations
 */
class Shields extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'misc.shields', 'shields', 'shields');
    this.regex = new RegExp(`^${this.bot.escapedPrefix}shield(?: +([\\d+\\.?\\d* ]+))?`, 'i');

    this.usages = [
      {
        description: 'Display an enemy\'s current shields.',
        parameters: ['base shields', 'base level', 'current level'],
      },
    ];
  }

  /**
   * Run the command
   * @param {Message} message Message with a command to handle, reply to,
   *                          or perform an action based on parameters.
   */
  run(message) {
    const pattern3Params = /(\d+\.?\d*)(?:\s+(\d+\.?\d*)\s+(\d+\.?\d*))?$/;
    const params = message.content.match(pattern3Params);
    const color = params && params.length > 3 ? 0x00ff00 : 0xff0000;
    const embed = {
      color,
      author: {
        name: this.bot.client.user.clientID,
        icon_url: this.bot.client.user.avatarURL,
      },
      title: 'Warframe - Shields',
      url: 'https://warframe.com',
      thumbnail: {
        url: 'http://i.imgur.com/BVUXIjA.png',
      },
      fields: [
        {
          name: '_ _',
          value: '',
        },
      ],
      footer: {
        icon_url: 'https://avatars1.githubusercontent.com/u/24436369',
        text: 'Data evaluated by Warframe Community Developers',
      },
    };

    if (params && params.length > 3) {
      const shields = params[1];
      const baseLevel = params[2];
      const currentLevel = params[3];
      this.logger.debug('Entered 3-param shield');
      const calc = shieldCalc(shields, baseLevel, currentLevel);
      embed.fields[0].name = 'Shield calculation';
      embed.fields[0].value = shieldString(calc, currentLevel);
    } else {
      this.logger.debug('Entered 0-param shield');
      embed.fields[0].value = `${this.bot.prefix}shields (Base Shelds) (Base Level) (Current Level) - calculate shields and stats.`;
      embed.fields[0].name = 'Possible uses include:';
    }

    message.channel.sendEmbed(embed);
  }
}

module.exports = Shields;
