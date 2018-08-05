'use strict';

const Command = require('../../models/Command.js');
const DarvoEmbed = require('../../embeds/DarvoEmbed.js');

/**
 * Displays today's Darvo deal
 */
class Darvo extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'warframe.worldstate.darvo', 'darvo', 'Displays today\'s Darvo deal');
    this.regex = new RegExp(`^${this.call}(?:\\s+on\\s+([pcsxb14]{2,3}))?$`, 'i');
  }

  async run(message) {
    const platformParam = message.strippedContent.match(this.regex)[1];
    const platform = platformParam || await this.settings.getChannelSetting(message.channel, 'platform');
    const ws = await this.bot.worldStates[platform.toLowerCase()].getData();
    const deal = ws.dailyDeals[0];
    await this.messageManager.embed(message, new DarvoEmbed(this.bot, deal, platform), true, false);
    return this.messageManager.statuses.SUCCESS;
  }
}

module.exports = Darvo;
