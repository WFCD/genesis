'use strict';

const Fetcher = require('../../resources/Fetcher.js');
const RaidEmbed = require('../../embeds/RaidEmbed.js');
const Command = require('../../Command.js');

/**
 * Returns search results from the Warframe wiki
 */
class Raid extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'warframe.stats.raid', 'raid', 'Get the raid record for a desired user, or for the calling user');
    this.regex = new RegExp(`^(?:${this.call}s?|trials?)\\s*(.+)?`, 'i');
    this.usages = [
      {
        description: 'Search for a users\'s raid stats',
        parameters: ['username'],
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
    let query = message.strippedContent.match(this.regex)[1];
    if (!query || typeof query === 'undefined') {
      query = message.member ? message.member.displayName : message.author.username;
      query = query.replace('*', '');
    }
    this.logger.debug(`Searched for query: ${query}`);

    const platform = await this.bot.settings.getChannelSetting(message.channel, 'platform');
    const url = encodeURI(`https://api.trials.wf/api/player/${platform.toLowerCase()}/${query}/completed`);
    const data = await (new Fetcher(url)).httpGet();
    this.messageManager.embed(message, new RaidEmbed(this.bot,
      data, query, platform.toLowerCase()), true, false);
    return this.messageManager.statuses.SUCCESS;
  }
}

module.exports = Raid;
