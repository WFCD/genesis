'use strict';

const Command = require('../../models/Command');
const SyndicateEmbed = require('../../embeds/SyndicateEmbed');

class Solaris extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'warframe.worldstate.solaris', 'solaris', 'Display the currently active Solaris bounties');
    this.regex = new RegExp(`^${this.call}s?\\s?(?:on\\s+([pcsxb14]{2,3}))?`, 'i');
  }

  async run(message, ctx) {
    const platformParam = message.strippedContent.match(/[pcsxb14]{2,3}/ig);
    const platform = platformParam && platformParam.length ? platformParam[0] : ctx.platform;
    const ws = await this.bot.worldStates[platform.toLowerCase()].getData();
    const solaris = ws.syndicateMissions.filter(m => m.syndicate == 'Solaris United');

    if (solaris && solaris.length) {
      // make the embed
      this.messageManager.embed(message, new SyndicateEmbed(this.bot, solaris, 'Solaris United', platform, true), true, true);
      return this.messageManager.statuses.SUCCESS;
    }
    this.messageManager.reply(message, 'No data at present', true, true);
    return this.messageManager.statuses.FAILURE;
  }
}

module.exports = Solaris;
