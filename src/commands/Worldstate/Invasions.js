'use strict';

const Command = require('../../models/Command.js');
const InvasionEmbed = require('../../embeds/InvasionEmbed.js');
const { createPageCollector, captures } = require('../../CommonFunctions');

/**
 * Displays the currently active Invasions
 */
class Invasions extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'warframe.worldstate.invasions', 'invasion', 'Display the currently active Invasions');
    this.regex = new RegExp(`^${this.call}s?(?:\\s?(compact))?(?:\\s+on\\s+${captures.platforms})?$`, 'i');
  }

  async run(message, ctx) {
    const platformParam = message.strippedContent.match(/[pcsxb14]{2,3}/ig);
    const compact = /compact/ig.test(message.strippedContent);
    const platform = platformParam && platformParam.length ? platformParam[0] : ctx.platform;
    const ws = await this.bot.worldStates[platform.toLowerCase()].getData();
    const invasions = ws.invasions.filter(i => !i.completed);
    const pages = [];
    if (compact) {
      pages.push(new InvasionEmbed(this.bot, invasions, platform));
    } else {
      invasions.forEach((invasion) => {
        pages.push(new InvasionEmbed(this.bot, [invasion], platform));
      });
    }
    const msg = await this.messageManager.embed(message, pages[0], true, false);
    createPageCollector(msg, pages, message.author);
    return this.messageManager.statuses.SUCCESS;
  }
}

module.exports = Invasions;
