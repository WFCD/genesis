'use strict';

const Command = require('../../models/Command.js');
const SimarisEmbed = require('../../embeds/SimarisEmbed.js');

/**
 * Displays the current simaris target
 */
class Simaris extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'warframe.worldstate.simaris', 'simaris', 'Display current Sanctuary status.');
    this.regex = new RegExp(`^${this.call}(?:\\s+on\\s+([pcsxb14]{2,3}))?$`, 'i');
  }

  async run(message) {
    const platformParam = message.strippedContent.match(this.regex)[1];
    const platform = platformParam || await this.settings.getChannelSetting(message.channel, 'platform');
    const ws = await this.bot.caches[platform.toLowerCase()].getDataJson();
    const { simaris } = ws;
    await this.messageManager.embed(
      message,
      new SimarisEmbed(this.bot, simaris, platform), true, false,
    );
    return this.messageManager.statuses.SUCCESS;
  }
}

module.exports = Simaris;
