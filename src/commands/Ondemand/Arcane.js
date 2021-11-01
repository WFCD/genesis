'use strict';

const fetch = require('../../resources/Fetcher');
const Command = require('../../models/Command.js');
const EnhancementEmbed = require('../../embeds/EnhancementEmbed.js');
const { apiBase } = require('../../CommonFunctions');

/**
 * Displays the response time for the bot and checks Warframe's servers to see if they are up
 */
class Arcane extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot The bot object
   */
  constructor(bot) {
    super(bot, 'warframe.misc.arcane', 'arcane', 'Get information about an Arcane Enhancement', 'WARFRAME');
    this.regex = new RegExp('^arcane(.+)?', 'i');
    this.usages = [
      {
        description: 'Get information about an Arcane Enhancement',
        parameters: ['enhancement name'],
      },
    ];
  }

  async run(message) {
    let arcane = message.strippedContent.match(this.regex)[1];
    if (arcane) {
      arcane = arcane.trim().toLowerCase();
      const results = await fetch(`${apiBase}/arcanes/search/${arcane}`);
      if (results.length > 0) {
        const embed = new EnhancementEmbed(this.bot, results[0]);
        await message.reply({ embeds: [embed] });
        return this.messageManager.statuses.SUCCESS;
      }
    }
    const enhancements = await fetch(`${apiBase}/arcanes`);
    const embed = new EnhancementEmbed(this.bot, undefined, enhancements);
    await message.reply({ embeds: [embed] });
    return this.messageManager.statuses.FAILURE;
  }
}

module.exports = Arcane;
