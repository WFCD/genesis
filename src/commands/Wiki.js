'use strict';

const Command = require('../Command.js');
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
    super(bot, 'misc.wiki', 'wiki', 'Search the Warframe Wiki for information');
    this.regex = new RegExp(`^${this.bot.escapedPrefix}wiki(.+)`, 'ig');
  }

  /**
   * Run the command
   * @param {Message} message Message with a command to handle, reply to,
   *                          or perform an action based on parameters.
   */
  run(message) {
    const query = this.regex.exec(message.cleanContent.match(this.regex)[0])[1];
    if (!query) {
      message.reply(`${this.md.codeMulti}Please specify a search term${this.md.blockEnd}`);
    } else {
      // default case
      this.logger.debug(`Searched for query: ${query}`);

      warframe.getSearchList({
        query,
        limit: 1,
      })
      .then((json) => {
        let result;
        const item = json.items[0];
        if (item) {
          result = `${item.title}: ${item.url}`;
        } else {
          result = `${this.md.codeMulti}No result for search, Operator. Attempt another search query.${this.md.blockEnd}`;
        }
        message.reply(result)
          .then(msg => msg.delete(100000))
          .catch(this.bot.errorHandle);
      })
      .catch(this.bot.errorHandle);
    }
  }
}

module.exports = Wiki;
