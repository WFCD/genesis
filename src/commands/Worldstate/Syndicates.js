'use strict';

const Command = require('../../Command.js');
const SyndicateEmbed = require('../../embeds/SyndicateEmbed.js');

const values = ['all', 'Arbiters of Hexis', 'Perrin Sequence', 'Cephalon Suda', 'Steel Meridian', 'New Loka', 'Red Veil', 'Ostrons', 'Assassins'];

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
    this.regex = new RegExp(`^${this.call}s?(?:(${values.join('|')}))?(?:\\s+on\\s+([pcsxb14]{2,3}))?$`, 'i');
    this.usages = [
      {
        description: 'Display syndicate nodes for a syndicate.',
        parameters: ['syndicate'],
      },
    ];
  }

  async run(message) {
    const matches = message.strippedContent.match(this.regex);
    const param1 = (matches[1] || '').toLowerCase();
    const param2 = (matches[2] || '').toLowerCase();
    const syndicate = values.indexOf(param1) > -1 ? param1 : 'all';
    let platformParam;
    if (this.platforms.indexOf(param2) > -1) {
      platformParam = param2;
    } else if (this.platforms.indexOf(param1) > -1) {
      platformParam = param1;
    }
    const platform = platformParam || await this.bot.settings.getChannelSetting(message.channel, 'platform');
    const ws = await this.bot.caches[platform.toLowerCase()].getDataJson();
    await this.messageManager.embed(message, new SyndicateEmbed(
      this.bot,
      ws.syndicateMissions, syndicate, platform,
    ), true, false);
    return this.messageManager.statuses.SUCCESS;
  }
}

module.exports = Syndicates;
