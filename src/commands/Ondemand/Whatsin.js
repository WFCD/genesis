'use strict';

const jsonQuery = require('json-query');

const Command = require('../../Command.js');
const WhatsinEmbed = require('../../embeds/WhatsinEmbed.js');
const allInOne = require('../../resources/allinone.json');

const inProgressEmbed = { title: 'Processing search...', color: 0xF1C40F };
const noResultsEmbed = { title: 'No results for that query. Please refine your search.', color: 0xff6961 };

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
    this.regex = new RegExp('^whatsin(?:\\s+([\\w+\\s]+))?', 'i');

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
    const item = message.strippedContent.match(this.regex)[1];

    message.channel.send('', { embed: inProgressEmbed })
      .then((sentMessage) => {
        if (!item) {
          return sentMessage.edit('', { embed: noResultsEmbed });
        }
        const results = jsonQuery(`relicRewards[${item.trim().toLowerCase()}]`, { data: allInOne, allowRegexp: true });
        if (typeof results.value === 'undefined' || results == null) {
          return sentMessage.edit('', { embed: noResultsEmbed });
        }
        return sentMessage.edit('', { embed: new WhatsinEmbed(this.bot, results.value) });
      })
      .catch(this.logger.error);
  }
}

module.exports = Whatsin;
