'use strict';

const Command = require('../../Command.js');
const ShieldEmbed = require('../../embeds/ShieldEmbed.js');

/**
 * Performs shield calculations
 */
class Shields extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'warframe.calculations.shields', 'shields', 'shields');
    this.regex = new RegExp('^shield(?: +([\\d+\\.?\\d* ]+))?', 'i');

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
    const params = message.strippedContent.match(pattern3Params);
    this.messageManager.embed(new ShieldEmbed(this.bot, params));
  }
}

module.exports = Shields;
