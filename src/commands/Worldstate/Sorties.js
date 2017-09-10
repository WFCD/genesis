'use strict';

const Command = require('../../Command.js');
const SortieEmbed = require('../../embeds/SortieEmbed.js');
const Wikia = require('node-wikia');

const warframe = new Wikia('warframe');


/**
 * Displays the currently active Invasions
 */
class Sorties extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'warframe.worldstate.sorties', 'sortie', 'Display the currently active sorties');
    this.regex = new RegExp(`^${this.call}s?(?:\\s+on\\s+([pcsxb14]{2,3}))?$`, 'i');
  }

  /**
   * Run the command
   * @param {Message} message Message with a command to handle, reply to,
   *                          or perform an action based on parameters.
   */
  async run(message) {
    const platformParam = message.strippedContent.match(this.regex)[1];
    const platform = platformParam || await this.bot.settings.getChannelPlatform(message.channel);
    const ws = await this.bot.caches[platform].getDataJson();
    const sortie = ws.sortie;
    if (sortie.expired) {
      await this.messageManager.sendMessage(message, 'There is currently no sortie', true, true);
    }
    const embed = new SortieEmbed(this.bot, sortie);
    try {
      const articles = await warframe.getSearchList({ query: sortie.boss, limit: 1 });
      const details = await warframe.getArticleDetails({ ids: articles.items.map(i => i.id) });
      const item = Object.values(details.items)[0];
      const thumb = item.thumbnail ? item.thumbnail.replace(/\/revision\/.*/, '') : undefined;
      if (thumb) {
        embed.thumbnail.url = thumb;
      }
      await this.messageManager.embed(message, embed, true, false);
    } catch (err) {
      await this.messageManager.embed(message, embed, true, false);
    }
  }
}

module.exports = Sorties;
