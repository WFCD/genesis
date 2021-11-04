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
      await message.reply({ content: 'There is currently no Steel Path Offering' });
      return this.constructor.statuses.FAILURE;
    }
    const embed = new SteelPathEmbed(this.bot, offering, { isCommand: true, i18n: ctx.i18n });
    await message.reply({ embeds: [embed] });
    return this.constructor.statuses.SUCCESS;
  }
};
