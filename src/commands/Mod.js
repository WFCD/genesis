'use strict';

const Command = require('../Command.js');
const Wikia = require('node-wikia');

const warframe = new Wikia('warframe');

/**
 * Displays mods from the wiki
 */
class Mod extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'misc.mod', 'mod', 'Search the Warframe Wiki for a mod\'s image');
    this.regex = new RegExp(`^${this.bot.escapedPrefix}mod(.+)`, 'i');
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
                 message.channel.sendFile(thumbUrl, 'Mod.png', message.author.toString()).then(() => {
                   if (message.deletable) {
                     return message.delete(2000);
                   }
                   return Promise.resolve();
                 }).catch(this.logger.error);
               }
             });
             if (!sent) {
               message.reply(`${this.md.codeMulti}No result for search, Operator. Attempt another search query.${this.md.blockEnd}`)
               .then(() => {
                 if (message.deletable) {
                   return message.delete(2000);
                 }
                 return Promise.resolve();
               }).catch(this.logger.error);
             }
           });
        });
      })
      .catch((error) => {
        this.logger.error(error);
        message.reply(`${this.md.codeMulti}No result for search, Operator. Attempt another search query.${this.md.blockEnd}`)
        .then(() => {
          if (message.deletable) {
            return message.delete(2000);
          }
          return Promise.resolve();
        }).catch(this.logger.error);
      });
    }
  }
}

module.exports = Mod;
