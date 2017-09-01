'use strict';

const Fetcher = require('../../resources/Fetcher.js');
const Command = require('../../Command.js');
const WhatsinEmbed = require('../../embeds/WhatsinEmbed.js');

const inProgressEmbed = { title: 'Processing search...', color: 0xF1C40F };
const noResultsEmbed = { title: 'No results for that query. Please refine your search.', color: 0xff6961 };
const relicBase = 'http://drops.warframestat.us/data/relics';

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
    super(bot, 'warframe.misc.whatsin', 'whatsin', 'Find what\'s in a relic');
    this.regex = new RegExp('^whatsin(?:\\s+(axi|neo|meso|lith)\\s?(\\w\\d+))?', 'i');

    this.usages = [
      {
        description: 'Display what drops from a relic',
        parameters: ['relic'],
      },
    ];
  }

  /**
   * Run the command
   * @param {Message} message Message with a command to handle, reply to,
   *                          or perform an action based on parameters.
   */
  run(message) {
    let tier = message.strippedContent.match(this.regex)[1];
    let relicName = message.strippedContent.match(this.regex)[2];

    message.channel.send('', { embed: inProgressEmbed })
      .then((sentMessage) => {
        if (!(tier && relicName)) {
          return sentMessage.edit('', { embed: noResultsEmbed });
        }
        tier = toTitleCase(tier.trim());
        relicName = toTitleCase(relicName.trim());
        return (new Fetcher(`${relicBase}/${tier}/${relicName}.json`)).httpGet()
          .then((relicData) => {
            if (relicData) {
              sentMessage.edit('', { embed: new WhatsinEmbed(this.bot, relicData, tier, relicName) });
            }
          })
          .catch((error) => {
            this.logger.error(error);
            sentMessage.edit('', { embed: noResultsEmbed });
          });
      })
      .catch(this.logger.error);
  }
}

module.exports = Whatsin;
