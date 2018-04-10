'use strict';

const Command = require('../../models/Command.js');
const WikiEmbed = require('../../embeds/WikiEmbed.js');
const Wikia = require('node-wikia');

const warframe = new Wikia('warframe');

/**
 * Returns search results from the Warframe wiki
 */
class Wiki extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'warframe.misc.wiki', 'wiki', 'Search the Warframe Wiki for information');
    this.regex = new RegExp('^wiki\\s*([\\w\\s-]+)?', 'i');
    this.usages = [
      {
        description: 'Search the Warframe wiki for a specific topic',
        parameters: ['topic'],
      },
    ];
    this.noResult = `${this.md.codeMulti}No result for search, Operator. Attempt another search query.${this.md.blockEnd}`;
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
      this.messageManager.reply(message, this.noResult, true, true);
      return this.messageManager.statuses.FAILURE;
    }
    try {
      this.logger.debug(`Searched for query: ${query}`);
      const articles = await warframe.getSearchList({ query, limit: 1 });
      const details = await warframe.getArticleDetails({ ids: articles.items.map(i => i.id) });
      this.messageManager.embed(message, new WikiEmbed(this.bot, details), true, false);
      return this.messageManager.statuses.SUCCESS;
    } catch (error) {
      this.messageManager.reply(message, this.noResult, true, true);
      return this.messageManager.statuses.FAILURE;
    }
  }
}

module.exports = Wiki;
