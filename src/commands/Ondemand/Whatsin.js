'use strict';

const fetch = require('../../resources/Fetcher');

const Command = require('../../models/Command');
const WhatsinEmbed = require('../../embeds/WhatsinEmbed');

const inProgressEmbed = { title: 'Processing search...', color: 0xF1C40F };
const noResultsEmbed = { title: 'No results for that query. Please refine your search.', color: 0xff6961 };
const relicBase = 'https://drops.warframestat.us/data/relics';

function toTitleCase(str) {
  return str.replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
}

/**
 * Looks up locations of items
 */
class Whatsin extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'warframe.misc.whatsin', 'whatsin', 'Find what\'s in a relic', 'WARFRAME');
    this.regex = new RegExp('^whatsin(?:\\s+(axi|neo|meso|lith)\\s?(\\w\\d+))?', 'i');

    this.usages = [
      {
        description: 'Display what drops from a relic',
        parameters: ['relic'],
      },
    ];
  }

  async run(message, ctx) {
    let tier = message.strippedContent.match(this.regex)[1];
    let relicName = message.strippedContent.match(this.regex)[2];

    const sentMessage = await message.reply({ embeds: [inProgressEmbed] });
    if (!(tier && relicName)) {
      await sentMessage.edit({ embeds: [noResultsEmbed] });
      return this.constructor.statuses.FAILURE;
    }
    tier = toTitleCase(tier.trim());
    relicName = toTitleCase(relicName.trim());
    try {
      const relicData = await ctx.ws.relic(tier, relicName);
      if (relicData) {
        await sentMessage.edit({ embeds: [new WhatsinEmbed(null, relicData, tier, relicName)] });
        return this.constructor.statuses.SUCCESS;
      }
    } catch (error) {
      this.logger.error(error);
    }
    await sentMessage.edit({ embeds: [noResultsEmbed] });
    return this.constructor.statuses.FAILURE;
  }
}

module.exports = Whatsin;
