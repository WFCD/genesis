'use strict';

const Command = require('../../models/Command.js');
const FissureEmbed = require('../../embeds/FissureEmbed.js');
const { setupPages, captures } = require('../../CommonFunctions');

/**
 * Displays the currently active Invasions
 */
class Fissures extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'warframe.worldstate.fissures', 'fissure', 'Get the current list of Void Fissure Missions');
    this.regex = new RegExp(`^${this.call}s?(?:\\s?(compact))?(?:\\s+on\\s+${captures.platforms})?$`, 'i');
  }

  async run(message, ctx) {
    const platformParam = message.strippedContent.match(new RegExp(`(?:on\\s?${captures.platforms})`, 'ig'));
    const compact = /compact/ig.test(message.strippedContent);
    const platform = platformParam && platformParam.length ? platformParam[0].replace('on ', '') : ctx.platform;
    const ws = await this.bot.worldStates[platform.toLowerCase()].getData();
    const fissures = ws.fissures.sort((a, b) => a.tierNum > b.tierNum);

    if (!fissures.length) {
      this.messageManager.reply(message, ctx.i18n`No Fissures Active`, true, true);
    }

    const pages = [];
    if (compact) {
      pages.push(new FissureEmbed(this.bot, fissures, platform));
    } else {
      fissures.forEach((fissure) => {
        pages.push(new FissureEmbed(this.bot, [fissure], platform));
      });
    }
    await setupPages(pages, { message, settings: this.settings, mm: this.messageManager });
    return this.messageManager.statuses.SUCCESS;
  }
}

module.exports = Fissures;
