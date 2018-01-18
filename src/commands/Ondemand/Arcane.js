'use strict';

const Command = require('../../Command.js');
const EnhancementEmbed = require('../../embeds/EnhancementEmbed.js');
const request = require('request-promise');

/**
 * Displays the response time for the bot and checks Warframe's servers to see if they are up
 */
class Arcane extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot The bot object
   */
  constructor(bot) {
    super(bot, 'warframe.misc.arcane', 'arcane', 'Get information about an Arcane Enhancement');
    this.regex = new RegExp('^arcane(.+)?', 'i');
    this.usages = [
      {
        description: 'Get information about an Arcane Enhancement',
        parameters: ['enhancement name'],
      },
    ];
  }

  /**
   * Run the command
   * @param {Message} message Message with a command to handle, reply to,
   *                          or perform an action based on parameters.
   * @returns {string} success status
   */
  async run(message) {
    let arcane = message.strippedContent.match(this.regex)[1];
    const options = {
      uri: 'https://api.warframestat.us/arcanes',
      json: true,
      rejectUnauthorized: false,
    };
    if (arcane) {
      arcane = arcane.trim().toLowerCase();
      options.uri = `https://api.warframestat.us/arcanes?search=${arcane}`;
      const results = await request(options);
      if (results.length > 0) {
        this.messageManager.embed(message, new EnhancementEmbed(this.bot, results[0]), true, false);
        return this.messageManager.statuses.SUCCESS;
      }
    }
    options.uri = 'https://api.warframestat.us/arcanes';
    const enhancements = await request(options);
    this.messageManager.embed(
      message,
      new EnhancementEmbed(this.bot, undefined, enhancements), true, false,
    );
    return this.messageManager.statuses.FAILURE;
  }
}

module.exports = Arcane;
