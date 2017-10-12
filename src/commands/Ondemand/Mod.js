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
   * @returns {string} success status
   */
  async run(message) {
    const query = this.regex.exec(message.strippedContent.match(this.regex)[0])[1];
    if (!query) {
      this.messageManager.reply(message, this.noResultStr, true, false);
      return this.messageManager.statuses.FAILURE;
    }
    const searchJson = await warframe.getSearchList({ query, limit: 1 });
    const [{ id }] = searchJson.items;
    const detailsJson = await warframe.getArticleDetails({ ids: [id] });
    let thumbUrl = detailsJson.items[`${id}`].thumbnail;
    thumbUrl = thumbUrl ? thumbUrl.replace(/\/revision\/.*/, '') : 'https://i.imgur.com/11VCxbq.jpg';

    const list = await warframe.getArticlesList({ category: 'Mods', limit: 1000 });
    let sent = false;
    list.items.forEach((item) => {
      if (item.id === id && !sent) {
        sent = true;
        const embed = {
          title: query,
          url: detailsJson.basepath + detailsJson.items[`${id}`].url,
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
      return this.messageManager.statuses.FAILURE;
    }
    return this.messageManager.statuses.SUCCESS;
  }
}

module.exports = Mod;
