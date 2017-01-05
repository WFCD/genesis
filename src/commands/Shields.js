'use strict';

const Command = require('../Command.js');

function shieldCalc(baseShields, baseLevel, currentLevel) {
  return (parseFloat(baseShields) +
    (((parseFloat(currentLevel) - parseFloat(baseLevel)) ** 2)
    * 0.0075 * parseFloat(baseShields))).toFixed(2);
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
    let shieldString;
    if (params && params.length > 3) {
      const shields = params[1];
      const baseLevel = params[2];
      const currentLevel = params[3];
      this.logger.debug('Entered 3-param shield');
      const calc = shieldCalc(shields, baseLevel, currentLevel);
      shieldString = this.shieldString(calc, currentLevel);
    } else {
      this.logger.debug('Entered 0-param shield');
      const shieldInstruct3 = `${this.bot.prefix}shields (Base Shelds) (Base Level) (Current Level) calculate shields and stats.`;
      shieldString = `${this.md.codeMulti}Possible uses include:${this.md.lineEnd}${shieldInstruct3}${this.md.blockEnd}`;
    }

    message.reply(shieldString);
  }

  shieldString(shields, level) {
    return `${this.md.codeMulti}At level ${parseFloat(level).toFixed(0)}, your enemy would have ${shields} Shields.${this.md.blockEnd}`;
  }
}

module.exports = Shields;
