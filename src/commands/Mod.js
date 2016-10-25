'use strict';

const Command = require('../Command.js');
const Wikia = require('node-wikia');

const warframe = new Wikia('warframe');

/**
 * Describes the Mod command
 */
class Mod extends Command {
  constructor(bot) {
    super(bot);
    this.commandId = 'genesis.mod';
    this.commandRegex = new RegExp(`^${bot.escapedPrefix}mod(.+)`, 'i');
    this.commandHelp = `${bot.prefix}mod             | Search the Warframe Wiki for a mod's image`;
    this.bot = bot;
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
    message.channel.startTyping();
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
             this.bot.errorHandle(error);
             message.reply(`${this.md.codeMulti}No result for search, Operator. Attempt another search query.${this.md.blockEnd}`);
           });
        })
        .catch((error) => {
          this.bot.errorHandle(error);
          message.reply(`${this.md.codeMulti}No result for search, Operator. Attempt another search query.${this.md.blockEnd}`);
        });
      })
      .catch((error) => {
        this.bot.errorHandle(error);
        message.reply(`${this.md.codeMulti}No result for search, Operator. Attempt another search query.${this.md.blockEnd}`);
      });
    }
    message.channel.stopTyping();
  }
}

module.exports = Mod;
