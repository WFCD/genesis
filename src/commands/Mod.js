'use strict';

const Command = require('../Command.js');
const Wikia = require('node-wikia');
const md = require('node-md-config');

const warframe = new Wikia('warframe');

/**
 * Describes the Mod command
 */
class Mod extends Command {
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
    this.commandId = 'genesis.mod';
    this.commandRegex = new RegExp(`^${regexPrefix}mod(.+)`, 'i');
    this.commandHelp = `${prefix}mod             | Search the Warframe Wiki for a mod's image`;
  }

  run(message) {
    const query = this.commandRegex.exec(message.cleanContent.match(this.commandRegex)[0])[1];
    if (!query) {
      message.reply(`${this.md.codeMulti}Please specify a search term${this.md.blockEnd}`);
    } else {
      warframe.getSearchList({
        query,
        limit: 1,
      })
      .then((searchJson) => {
        const id = searchJson.items[0].id;
        warframe.getArticleDetails({
          ids: [id],
        })
        .then((detailsJson) => {
          let thumbUrl = detailsJson.items[`${id}`].thumbnail;
          thumbUrl = thumbUrl.replace(/\/revision\/.*/, '');
          warframe.getArticlesList({
            category: 'Mods',
            limit: 1000,
          })
           .then((list) => {
             let sent = false;
             list.items.forEach((item) => {
               if (item.id === id) {
                 sent = true;
                 message.channel.sendFile(thumbUrl, 'Mod.png', message.author.toString());
               }
             });
             if (!sent) {
               message.reply(`${this.md.codeMulti}No result for search, Operator. Attempt another search query.${this.md.blockEnd}`);
             }
           })
           .catch((error) => {
             this.logger.error(error);
             message.reply(`${this.md.codeMulti}No result for search, Operator. Attempt another search query.${this.md.blockEnd}`);
           });
        })
        .catch((error) => {
          this.logger.error(error);
          message.reply(`${this.md.codeMulti}No result for search, Operator. Attempt another search query.${this.md.blockEnd}`);
        });
      })
      .catch((error) => {
        this.logger.error(error);
        message.reply(`${this.md.codeMulti}No result for search, Operator. Attempt another search query.${this.md.blockEnd}`);
      });
    }
  }
}

module.exports = Mod;
