'use strict';

const Command = require('../../models/InlineCommand.js');
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
    super(bot, 'borko', 'when borko', 'Display the current status of the Void Trader');
    this.regex = new RegExp('(?:where|when|whe|why|which).*(?:borko|baro|bimjo|bonko|bilbo|bermo|barmo|bruno|borso|borneo|bosnia|beerr?ow)', 'ig');
  }

  async run(message, ctx) {
    const platformParam = message.strippedContent.match(this.regex)[1];
    const platform = platformParam || ctx.platform;
    const ws = await this.bot.worldStates[platform.toLowerCase()].getData();
    await this.messageManager
      .embed(message, new VoidTraderEmbed(this.bot, ws.voidTrader, platform), false, true);
    return this.messageManager.statuses.SUCCESS;
  }
}

module.exports = Baro;
