'use strict';

const Command = require('../Command.js');
const Wikia = require('node-wikia');
const md = require('node-md-config');

const warframe = new Wikia('warframe');

/**
 * Describes the Wiki command
 */
class Wiki extends Command {
  /**
   * Constructs a callable command
   * @param  {Logger}           logger                The logger object
   * @param  {string}           [options.prefix]      Prefix for calling the bot
   * @param  {string}           [options.regexPrefix] Escaped prefix for regex for the command
   * @param  {MarkdownSettings} [options.mdConfig]    The markdown settings
   */
  // eslint-disable-next-line no-useless-escape
  constructor(logger, { mdConfig = md, regexPrefix = '\/', prefix = '/' } = {}) {
    super(logger, { mdConfig, regexPrefix, prefix });
    this.commandId = 'genesis.wiki';
    this.commandRegex = new RegExp(`^${regexPrefix}wiki(.+)`, 'ig');
    this.commandHelp = `${prefix}wiki <query>    | Search the Warframe Wiki for information`;
    this.logger = logger;
  }

  run(message) {
    const query = this.commandRegex.exec(message.cleanContent.match(this.commandRegex)[0])[1];
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
          result = `${this.md.linkBegin}${item.title}${this.md.linkMid}${item.url}${this.md.linkEnd}`;
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
