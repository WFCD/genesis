'use strict';

const Command = require('../Command.js');
const md = require('node-md-config');

function shieldCalc(baseShields, baseLevel, currentLevel) {
  return (parseFloat(baseShields) +
          (Math.pow(parseFloat(currentLevel) - parseFloat(baseLevel), 2)
           * 0.0075 * parseFloat(baseShields)))
          .toFixed(2);
}

/**
 * Describes the Shield command
 */
class Shields extends Command {
  /**
   * Constructs a callable command
   * @param  {Logger}           logger                The logger object
   * @param  {string}           [options.prefix]      Prefix for calling the bot
   * @param  {string}           [options.regexPrefix] Escaped prefix for regex for the command
   * @param  {MarkdownSettings} [options.mdConfig]    The markdown settings
   */
  // eslint-disable-next-line no-useless-escape
  constructor(logger, { mdConfig = md, regexPrefix = '\/', prefix = '/' } = {}) {
    super(logger, { mdConfig, regexPrefix, prefix });
    this.commandId = 'genesis.shields';
    // eslint-disable-next-line no-useless-escape
    this.commandRegex = new RegExp(`^${regexPrefix}shield(?: +([\d+\.?\d* ]+))?`, 'i');
    this.commandHelp = `${prefix}shields         | Display instructions for calculating shields${md.lineEnd}` +
                       `${prefix}shields <params>| Display the current shields. Parameters: <base shields> <base level> <current level>`;
  }

  run(message) {
    const pattern3Params = /(\d+\.?\d*)(?:\s+(\d+\.?\d*)\s+(\d+\.?\d*))?$/;
    const params = message.content.match(pattern3Params);
    let shieldString;
    if (params.length > 3) {
      const shields = params[1];
      const baseLevel = params[2];
      const currentLevel = params[3];
      this.bot.debug('Entered 3-param shield');
      const calc = shieldCalc(shields, baseLevel, currentLevel);
      shieldString = this.shieldString(calc, currentLevel);
    } else {
      this.bot.debug('Entered 0-param shield');
      const shieldInstruct3 = 'shields (Base Shelds) (Base Level) (Current Level) calculate shields and stats.';
      shieldString = `${this.md.codeMulti}Possible uses include:${this.md.lineEnd}${shieldInstruct3}${this.md.blockEnd}`;
    }

    message.reply(shieldString);
  }

  shieldString(shields, level) {
    return `${this.md.codeMulti}At level ${parseFloat(level).toFixed(0)}, your enemy would have ${shields} Shields.${this.md.blockEnd}`;
  }
}

module.exports = Shields;
