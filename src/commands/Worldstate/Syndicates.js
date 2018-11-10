'use strict';

const Command = require('../../models/Command.js');
const SyndicateEmbed = require('../../embeds/SyndicateEmbed.js');
const { createPageCollector } = require('../../CommonFunctions');
const syndicates = require('../../resources/syndicates.json');

const values = syndicates.map(s => s.display.toLowerCase());

/**
 * Displays the currently active Invasions
 */
class Syndicates extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'warframe.worldstate.syndicate', 'syndicate', 'Gets the starchat nodes for the desired syndicate, or all.');
    this.regex = new RegExp(`^${this.call}\\s?(?:(${values.join('|')}))?(?:\\s+on\\s+([pcsxb14]{2,3}))?$`, 'i');
    this.usages = [
      {
        description: 'Display syndicate nodes for a syndicate.',
        parameters: ['syndicate'],
      },
    ];
  }

  async run(message, ctx) {
    const matches = message.strippedContent.match(this.regex);
    const param1 = (matches[1] || '').toLowerCase();
    const param2 = (matches[2] || '').toLowerCase();
    const syndicate = values.indexOf(param1) > -1 ? param1.toLowerCase() : 'all';
    let platformParam;
    if (this.platforms.indexOf(param2) > -1) {
      platformParam = param2;
    } else if (this.platforms.indexOf(param1) > -1) {
      platformParam = param1;
    }
    const platform = platformParam || ctx.platform;
    const ws = await this.bot.worldStates[platform.toLowerCase()].getData();
    const pages = [];
    const matching = ws.syndicateMissions.filter(m => m.syndicate.toLowerCase() === syndicate || syndicate === 'all');
    if (matching.length) {
      matching.forEach((mission) => {
        pages.push(new SyndicateEmbed(this.bot, [mission], mission.syndicate, platform, true));
      });
      if (pages.length) {
        const msg = await this.messageManager.embed(message, pages[0], false, false);
        await createPageCollector(msg, pages, message.author);
      }
      if (parseInt(await this.settings.getChannelSetting(message.channel, 'delete_after_respond'), 10) && message.deletable) {
        message.delete(10000);
      }
      return this.messageManager.statuses.SUCCESS;
    }
    return this.messageManager.statuses.FAILURE;
  }
}

module.exports = Syndicates;
