'use strict';

const Command = require('../../Command.js');
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
    super(bot, 'warframe.misc.mod', 'mod', 'Search the Warframe Wiki for a mod\'s image');
    this.regex = new RegExp('^mod(.+)', 'i');
    this.noResultStr = `${this.md.codeMulti}No result for search, Operator. Attempt another search query.${this.md.blockEnd}`;
  }

  /**
   * Run the command
   * @param {Message} message Message with a command to handle, reply to,
   *                          or perform an action based on parameters.
   */
  run(message) {
    const query = this.regex.exec(message.strippedContent.match(this.regex)[0])[1];
    if (!query) {
      this.messageManager.reply(message, this.noResultStr, true, false);
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
                 const embed = {
                   title: query,
                   color: 0xC0C0C0,
                   description: `Mod result for ${query}`,
                   image: {
                     url: thumbUrl,
                   },
                 };
                 this.messageManager.embed(message, embed, true, false);
               }
             });
             if (!sent) {
               this.messageManager.reply(message, this.noResultStr, true, false);
             }
           });
        });
      })
      .catch((error) => {
        this.logger.error(error);
        this.messageManager.reply(message, this.noResultStr, true, false);
      });
    }
  }
}

module.exports = Mod;
