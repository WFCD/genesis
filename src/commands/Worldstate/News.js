'use strict';

const Command = require('../../Command.js');
const NewsEmbed = require('../../embeds/NewsEmbed.js');

/**
 * Displays the currently active warframe news
 */
class News extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'warframe.worldstate.news', 'news', 'Display the currently active news');
    this.regex = new RegExp(`^${this.call}(?:\\s+on\\s+([pcsxb14]{2,3}))?$`, 'i');
  }

  async run(message) {
    const platformParam = message.strippedContent.match(this.regex)[1];
    const platform = platformParam || await this.bot.settings.getChannelPlatform(message.channel);
    const ws = await this.bot.caches[platform].getDataJson();
    const news = ws.news.filter(n => !n.update && !n.primeAccess);
    await this.messageManager.embed(message, new NewsEmbed(this.bot, news), true, false);
    return this.messageManager.statuses.SUCCESS;
  }
}

module.exports = News;
