'use strict';

const Command = require('../Command.js');
const md = require('node-md-config');

/**
 * Describes the Armor command
 */
class Armor extends Command {
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
    this.commandId = 'genesis.damage';
    // eslint-disable-next-line no-useless-escape
    this.commandRegex = new RegExp(`^${regexPrefix}damage$`, 'i');
    this.commandHelp = `${prefix}damage          | Display Damage 2.0 chart`;
    this.damageChart = 'http://morningstar.ninja/chart/Damage_2.0_Resistance_Flowchart.png';
  }

  run(message) {
    message.channel.sendFile(this.damageChart, 'Damage.png',
                             `Operator ${message.author.toString()}, the damage flowchart, at your request.`);
  }
}

module.exports = Armor;
