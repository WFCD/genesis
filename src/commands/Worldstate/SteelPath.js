'use strict';

const Command = require('../../models/Command.js');
const SteelPathEmbed = require('../../embeds/SteelPathEmbed');

module.exports = class SteelPath extends Command {
  constructor(bot) {
    super(bot, 'warframe.worldstate.steelpath', 'steelpath', 'Display the currently active Steel Path Rotating offering.', 'WARFRAME');
  }

  async run(message, ctx) {
    const offering = await this.ws.get('steelPath', ctx.platform, ctx.language);
    if (!offering.currentReward) {
      await this.messageManager.sendMessage(message, 'There is currently no Steel Path Offering', true, true);
      return this.messageManager.statuses.FAILURE;
    }
    const embed = new SteelPathEmbed(this.bot, offering, { isCommand: true, i18n: ctx.i18n });
    await this.messageManager.embed(message, embed, true, false);
    return this.messageManager.statuses.SUCCESS;
  }
};
