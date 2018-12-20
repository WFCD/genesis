'use strict';

const Command = require('../../models/Command.js');
const NewsEmbed = require('../../embeds/NewsEmbed.js');
const { captures, createPageCollector } = require('../../CommonFunctions');

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
    this.regex = new RegExp(`^${this.call}\\s?(?:(compact))?(?:\\s+on\\s+${captures.platforms})?$`, 'i');
  }

  async run(message, ctx) {
    const platformParam = message.strippedContent.match(this.regex)[1];
    const platform = platformParam || ctx.platform;
    const compact = /compact/ig.test(message.strippedContent);
    const language = await this.settings.getChannelSetting(message.channel, 'language');
    const ws = await this.bot.worldStates[platform.toLowerCase()].getData();
    const news = ws.news.filter(n => !n.update && !n.primeAccess && n.translations[language]);
    
    if (compact) {
      await this.messageManager
        .embed(message, new NewsEmbed(this.bot, news, undefined, platform), true, true);
    } else {
      const pages = [];
      news.forEach((article) => {
        pages.push(new NewsEmbed(this.bot, [article], undefined, platform));
      });
      if (pages.length) {
        const msg = await this.messageManager.embed(message, pages[0], false, false);
        await createPageCollector(msg, pages, message.author);
      }
      if (parseInt(await this.settings.getChannelSetting(message.channel, 'delete_after_respond'), 10) && message.deletable) {
        message.delete(10000);
      }
    }

    return this.messageManager.statuses.SUCCESS;
  }
}

module.exports = News;
