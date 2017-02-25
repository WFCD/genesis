'use strict';

const Command = require('../../Command.js');
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
  }

  /**
   * Run the command
   * @param {Message} message Message with a command to handle, reply to,
   *                          or perform an action based on parameters.
   */
  run(message) {
    const query = message.strippedContent.match(this.regex)[1];
    if (!query) {
      message.reply(`${this.md.codeMulti}Please specify a search term${this.md.blockEnd}`);
    } else {
      this.logger.debug(`Searched for query: ${query}`);

      warframe.getSearchList({
        query,
        limit: 1,
      }).then(articles => warframe.getArticleDetails({
        ids: articles.items.map(i => i.id),
      })).then((details) => {
        const item = Object.values(details.items)[0];
        return message.channel.sendEmbed({
          title: item.title,
          type: 'rich',
          url: details.basepath + item.url,
          image: {
            url: item.thumbnail.replace(/\/revision\/.*/, ''),
            width: item.original_dimensions.width,
            height: item.original_dimensions.height,
          },
          description: item.abstract,
        });
      })
      .catch((err) => {
        if (err.exception && err.exception.code === 404) {
          message.reply(`${this.md.codeMulti}No result for search, Operator. Attempt another search query.${this.md.blockEnd}`)
            .then(msg => msg.delete(100000))
            .catch(this.logger.error);
        } else {
          this.logger.error(err);
        }
      });
    }
  }
}

module.exports = Wiki;
