'use strict';

const Command = require('../Command.js');
const EarthCycleEmbed = require('../embeds/EarthCycleEmbed.js');

function getCurrentEarthCycle() {
  const cycleSeconds = Math.floor(Date.now() / 1000) % 28800; // One cycle = 8 hours = 28800 seconds
  const dayTime = cycleSeconds < 14400;

  let secondsLeft = 14400 - (cycleSeconds % 14400);

  const timePieces = [];
  if (secondsLeft > 3600) {
    timePieces.push(`${Math.floor(secondsLeft / 3600)}h`);
    secondsLeft %= 3600;
  }
  if (secondsLeft > 60) {
    timePieces.push(`${Math.floor(secondsLeft / 60)}m`);
    secondsLeft %= 60;
  }
  timePieces.push(`${secondsLeft}s`);

  return {
    dayTime,
    timeLeft: timePieces.join(' '),
  };
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
  }

  /**
   * Run the command
   * @param {Message} message Message with a command to handle, reply to,
   *                          or perform an action based on parameters.
   */
  run(message) {
    const state = getCurrentEarthCycle();
    message.channel.sendEmbed(new EarthCycleEmbed(this.bot, state))
    .then(() => {
      if (message.deletable) {
        return message.delete(2000);
      }
      return Promise.resolve();
    }).catch(this.logger.error);
  }
}

module.exports = EarthCycle;
