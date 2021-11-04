'use strict';

const Command = require('../../models/Command.js');
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
    super(bot, 'warframe.calculations.shields', 'shields', 'shields', 'WARFRAME');
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
    @returns {string} success status
   */
  async run(message) {
    const pattern3Params = /(\d+\.?\d*)(?:\s+(\d+\.?\d*)\s+(\d+\.?\d*))?$/;
    const params = message.strippedContent.match(pattern3Params);
    const embed = new ShieldEmbed(this.bot, params);
    await message.reply({ embeds: [embed] });
    if (params && params.length > 3) {
      return this.constructor.statuses.SUCCESS;
    }
    return this.constructor.statuses.FAILURE;
  }
}

module.exports = Shields;
