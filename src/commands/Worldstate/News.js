'use strict';

const Command = require('../../models/Command.js');
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
    const platform = platformParam || await this.settings.getChannelSetting(message.channel, 'platform');
    const language = await this.settings.getChannelSetting(message.channel, 'language');
    const ws = await this.bot.caches[platform.toLowerCase()].getDataJson();
    const news = ws.news.filter(n => !n.update && !n.primeAccess && n.translations[language]);
    await this.messageManager.embed(
      message,
      new NewsEmbed(this.bot, news, undefined, platform), true, false,
    );
    return this.messageManager.statuses.SUCCESS;
  }
}

module.exports = News;
