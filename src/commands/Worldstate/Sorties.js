'use strict';

const Wikia = require('node-wikia');
const Command = require('../../models/Command.js');
const SortieEmbed = require('../../embeds/SortieEmbed.js');
const { captures } = require('../../CommonFunctions');

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
    super(bot, 'warframe.worldstate.sorties', 'sortie', 'Display the currently active sorties', 'WARFRAME');
    this.regex = new RegExp(`^${this.call}s?(?:\\s+on\\s+${captures.platforms})?$`, 'i');
  }

  async run(message, ctx) {
    const platformParam = message.strippedContent.match(this.regex)[1];
    const platform = platformParam || ctx.platform;
    const sortie = await this.ws.get('sortie', platform, ctx.language);
    if (sortie.expired) {
      await message.reply({ content: 'There is currently no sortie' });
      return this.constructor.statuses.FAILURE;
    }
    const embed = new SortieEmbed(this.bot, sortie, platform);
    try {
      const articles = await warframe.getSearchList({ query: sortie.boss, limit: 1 });
      const details = await warframe.getArticleDetails({ ids: articles.items.map(i => i.id) });
      const item = Object.values(details.items)[0];
      const thumb = item.thumbnail ? item.thumbnail.replace(/\/revision\/.*/, '') : undefined;
      if (thumb) {
        embed.thumbnail.url = thumb;
      }
      await message.reply({ embeds: [embed] });
      return this.constructor.statuses.SUCCESS;
    } catch (err) {
      await message.reply({ embeds: [embed] });
      return this.constructor.statuses.SUCCESS;
    }
  }
}

module.exports = Sorties;
