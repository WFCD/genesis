'use strict';

const Command = require('../../models/Command.js');
const VoidTraderEmbed = require('../../embeds/VoidTraderEmbed.js');
const { captures } = require('../../CommonFunctions');

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
    this.regex = new RegExp(`^${this.call}(?:\\s+on\\s+${captures.platforms})?`, 'i');
  }

  async run(message, ctx) {
    const platformParam = message.strippedContent.match(this.regex)[1];
    const platform = platformParam || ctx.platform;
    const ws = await this.bot.worldStates[platform.toLowerCase()].getData();
    await this.messageManager
      .embed(message, new VoidTraderEmbed(this.bot, ws.voidTrader, platform), true, false);
    return this.messageManager.statuses.SUCCESS;
  }
}

module.exports = Baro;
