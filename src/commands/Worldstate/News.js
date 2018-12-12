'use strict';

const Command = require('../../models/Command.js');
const NewsEmbed = require('../../embeds/NewsEmbed.js');
const { captures } = require('../../CommonFunctions');

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
    this.regex = new RegExp(`^${this.call}(?:\\s+on\\s+${captures.platforms})?$`, 'i');
  }

  async run(message, ctx) {
    const platformParam = message.strippedContent.match(this.regex)[1];
    const platform = platformParam || ctx.platform;
    const language = await this.settings.getChannelSetting(message.channel, 'language');
    const ws = await this.bot.worldStates[platform.toLowerCase()].getData();
    const news = ws.news.filter(n => !n.update && !n.primeAccess && n.translations[language]);
    await this.messageManager.embed(
      message,
      new NewsEmbed(this.bot, news, undefined, platform), true, false,
    );
    return this.messageManager.statuses.SUCCESS;
  }
}

module.exports = News;
