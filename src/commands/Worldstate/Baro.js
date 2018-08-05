'use strict';

const Command = require('../../models/Command.js');
const VoidTraderEmbed = require('../../embeds/VoidTraderEmbed.js');

/**
 * Displays the currently active Invasions
 */
class Baro extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'warframe.worldstate.baro', 'baro', 'Display the current status of the Void Trader');
    this.regex = new RegExp(`^${this.call}(?:\\s+on\\s+([pcsxb14]{2,3}))?`, 'i');
  }

  async run(message) {
    const platformParam = message.strippedContent.match(this.regex)[1];
    const platform = platformParam || await this.settings.getChannelSetting(message.channel, 'platform');
    const ws = await this.bot.worldStates[platform.toLowerCase()].getData();
    await this.messageManager
      .embed(message, new VoidTraderEmbed(this.bot, ws.voidTrader, platform), true, false);
    return this.messageManager.statuses.SUCCESS;
  }
}

module.exports = Baro;
