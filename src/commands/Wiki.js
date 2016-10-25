'use strict';

const Command = require('../Command.js');
const Wikia = require('node-wikia');

const warframe = new Wikia('warframe');

/**
 * Describes the Wiki command
 */
class Wiki extends Command {
  constructor(bot) {
    super(bot);
    this.commandId = 'genesis.wiki';
    this.commandRegex = new RegExp(`^${bot.escapedPrefix}wiki(.+)`, 'ig');
    this.commandHelp = `${bot.prefix}wiki <query>    | Search the Warframe Wiki for information`;
    this.md = bot.md;
  }

  get id() {
    return this.commandId;
  }

  get call() {
    return this.commandRegex;
  }

  get help() {
    return this.commandHelp;
  }

  run(message) {
    const query = this.commandRegex.exec(message.cleanContent.match(this.commandRegex)[0])[1];
    if (!query) {
      message.reply(`${this.md.codeMulti}Please specify a search term${this.md.blockEnd}`);
    } else {
      // default case
      this.bot.debug(`Searched for query: ${query}`);

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
