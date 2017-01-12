'use strict';

const Command = require('../Command.js');
const moment = require('moment');

function getCurrentEarthCycle() {
  const hour = Math.floor(moment().valueOf() / 3600000) % 24;
  let cycle = 'Night';
  let opposite = 'Day';
  if ((hour >= 0 && hour < 4) || (hour >= 8 && hour < 12) || (hour >= 16 && hour < 20)) {
    cycle = 'Day';
    opposite = 'Night';
  }
  const hourleft = 3 - (hour % 4);
  const minutes = 59 - moment().minutes();
  const seconds = 59 - moment().seconds();
  const timePieces = [];
  if (hourleft > 0) {
    timePieces.push(`${hourleft}h`);
  }
  if (minutes > 0) {
    timePieces.push(`${minutes}m`);
  }
  if (seconds > 0) {
    timePieces.push(`${seconds}s`);
  }

  return `\`\`\`haskell\nOperator, Earth is currently in ${cycle}time. Time remaining until ${opposite}: ${timePieces.join(' ')}.\n\`\`\``;
}

/**
 * Displays the current stage in Earth's cycle
 */
class EarthCycle extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'misc.cycle', 'cycle', 'Current and remaining time in cycle of Earth rotation.');
    this.damageChart = 'http://morningstar.ninja/chart/Damage_2.0_Resistance_Flowchart.png';
  }

  /**
   * Run the command
   * @param {Message} message Message with a command to handle, reply to,
   *                          or perform an action based on parameters.
   */
  run(message) {
    const field = getCurrentEarthCycle();
    const color = field.indexOf('Daytime') !== -1 ? 0x00ff00 : 0x000066;

    const embed = {
      color,
      author: {
        name: this.bot.client.user.clientID,
        icon_url: this.bot.client.user.avatarURL,
      },
      title: 'Worldstate - Earth Cycle',
      url: 'https://warframe.com',
      description: 'Current Earth Day/Night Cycle:',
      thumbnail: {
        url: 'http://vignette1.wikia.nocookie.net/warframe/images/1/1e/Earth.png/revision/latest?cb=20161016212227',
      },
      fields: [
        {
          name: '_ _',
          value: field,
          inline: true,
        },
      ],
      footer: {
        icon_url: 'https://avatars1.githubusercontent.com/u/24436369',
        text: 'Data evaluated by warframe-wordstate-parser, Warframe Community Developers',
      },
    };

    message.channel.sendEmbed(embed)
    .then(() => {
      if (message.deletable) {
        return message.delete(2000);
      }
      return Promise.resolve();
    }).catch(this.logger.error);
  }
}

module.exports = EarthCycle;
