'use strict';

const Wikia = require('node-wikia');
const Command = require('../../models/Command.js');
const WikiEmbed = require('../../embeds/WikiEmbed.js');

const warframe = new Wikia('warframe');

const { emojify } = require('../../CommonFunctions');

const noResult = `${emojify('red_tick')} No result for search, Operator. Attempt another query.`;

/**
 * Returns search results from the Warframe wiki
 */
class Wiki extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'warframe.misc.wiki', 'wiki', 'Search the Warframe Wiki for information', 'WARFRAME');
    this.regex = new RegExp('^wiki\\s*([\\w\\s-]+)?', 'i');
    this.usages = [
      {
        description: 'Search the Warframe wiki for a specific topic',
        parameters: ['topic'],
      },
    ];
    this.enabled = false;
  }

  /**
   * Run the command
   * @param {Message} message Message with a command to handle, reply to,
   *                          or perform an action based on parameters.
   * @returns {string} success status
   */
  async run(message) {
    const query = message.strippedContent.match(this.regex)[1];
    if (!query) {
      message.channel.send(noResult);
      return this.messageManager.statuses.FAILURE;
    }
    try {
      this.logger.debug(`Searched for query: ${query}`);
      const articles = await warframe.getSearchList({ query: encodeURIComponent(query), limit: 1 });
      const details = await warframe.getArticleDetails({ ids: articles.items.map(i => i.id) });
      const embed = new WikiEmbed(this.bot, details);
      await message.channel.send(JSON.parse(JSON.stringify(embed)));
      return this.messageManager.statuses.SUCCESS;
    } catch (error) {
      message.channel.send(noResult);
      return this.messageManager.statuses.FAILURE;
    }
  }
}

module.exports = Wiki;
