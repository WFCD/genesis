'use strict';

const Command = require('../../Command.js');
const UpdateEmbed = require('../../embeds/NewsEmbed.js');

/**
 * Displays the currently active Warframe update news
 */
class Updates extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'warframe.worldstate.updates', 'update', 'Display the currently active update news');
    this.regex = new RegExp(`^${this.call}s?(?:\\s+on\\s+([pcsxb14]{2,3}))?$`, 'i');
  }

  async run(message) {
    const platformParam = message.strippedContent.match(this.regex)[1];
    const platform = platformParam || await this.bot.settings.getChannelPlatform(message.channel);
    const ws = await this.bot.caches[platform].getDataJson();
    const news = ws.news.filter(n => n.update);
    await this.messageManager.embed(message, new UpdateEmbed(this.bot, news, 'update'), true, false);
    return this.messageManager.statuses.SUCCESS;
  }
}

module.exports = Updates;
