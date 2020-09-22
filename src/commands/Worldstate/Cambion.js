'use strict';

const Command = require('../../models/Command');
const CambionEmbed = require('../../embeds/CambionEmbed');
const { captures } = require('../../CommonFunctions');

class Cambion extends Command {
  constructor(bot) {
    super(bot, 'warframe.worldstate.cambion', 'cambion', 'Display the currently active Cambion info', 'WARFRAME');
    this.regex = new RegExp(`^${this.call}s?\\s?(?:on\\s+${captures.platforms})?`, 'i');
  }

  async run(message, ctx) {
    const platformParam = message.strippedContent.match(captures.platforms);
    const platform = platformParam && platformParam.length ? platformParam[0] : ctx.platform;
    const entrati = (await this.ws.get('syndicateMissions', platform, ctx.language))
      .filter(m => m.syndicate === 'EntratiSyndicate');
    const cambion = await this.ws.get('cambionCycle', platform, ctx.language);
    if (entrati && entrati.length) {
      [cambion.bounty] = entrati;
    }

    // make the embed
    this.messageManager.embed(message, new CambionEmbed(this.bot, cambion), true, true);
    return this.messageManager.statuses.SUCCESS;
  }
}

module.exports = Cambion;
