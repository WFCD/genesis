'use strict';

const Command = require('../../Command.js');
const EventEmbed = require('../../embeds/ConstructionEmbed.js');

/**
 * Displays the current simaris target
 */
class Construction extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'warframe.worldstate.construction', 'construction', 'Display current construction progress.');
    this.regex = new RegExp(`^${this.call}(?:\\s+on\\s+([pcsxb14]{2,3}))?$`, 'i');
  }

  async run(message) {
    const platformParam = message.strippedContent.match(this.regex)[1];
    const platform = platformParam || await this.bot.settings
      .getChannelSetting(message.channel, 'platform');
    const ws = await this.bot.caches[platform.toLowerCase()].getDataJson();
    const embed = new EventEmbed(this.bot, ws.constructionProgress, platform.toUpperCase());
    await this.messageManager.embed(message, embed, true, true);
    return this.messageManager.statuses.SUCCESS;
  }
}

module.exports = Construction;
