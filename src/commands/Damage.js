'use strict';

const Command = require('../Command.js');

/**
 * Describes the Armor command
 */
class Armor extends Command {
  constructor(bot) {
    super(bot);
    this.commandId = 'genesis.damage';
    // eslint-disable-next-line no-useless-escape
    this.commandRegex = new RegExp(`^${bot.escapedPrefix}damage$`, 'i');
    this.commandHelp = `${bot.prefix}damage          | Display Damage 2.0 chart`;
    this.md = bot.md;
    this.damageChart = 'http://morningstar.ninja/chart/Damage_2.0_Resistance_Flowchart.png';
  }

  get id() {
    return this.commandId;
  }

  get call() {
    return this.commandRegex;
  }

  get help() {
    return this.commandHelp;
  }

  run(message) {
    message.channel.sendFile(this.damageChart, 'Damage.png',
                             `Operator ${message.author.toString()}, the damage flowchart, at your request.`);
  }
}

module.exports = Armor;
