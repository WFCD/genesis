'use strict';

const Command = require('../../Command.js');
const WhereisEmbed = require('../../embeds/WhereisEmbed.js');

const inProgressEmbed = { title: 'Processing search...', color: 0xF1C40F };
const noResultsEmbed = { title: 'No results for that query. Please refine your search.', description: 'This is either due to the item being vaulted or an invalid search. Sorry.', color: 0xff6961 };

function createGroupedArray(arr, chunkSize) {
  const groups = [];
  for (let i = 0; i < arr.length; i += chunkSize) {
    groups.push(arr.slice(i, i + chunkSize));
  }
  return groups;
}

function placeSort(a, b) {
  if (a.place < b.place) {
    return -1;
  } else if (a.place > b.place) {
    return 1;
  }
  return 0;
}

function itemSort(a, b) {
  if (a.item < b.item) {
    return -1;
  } else if (a.item > b.item) {
    return 1;
  }
  return placeSort(a, b);
}

function toTitleCase(str) {
  return str.replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
}


/**
 * Looks up locations of items
 */
class Whereis extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'warframe.misc.whereis', 'whereis', 'Find where something drops');
    this.regex = new RegExp('^where\\s?is\\s?(.+)?', 'i');

    this.usages = [
      {
        description: 'Display where something drops from',
        parameters: ['item'],
      },
    ];
  }

  /**
   * Run the command
   * @param {Message} message Message with a command to handle, reply to,
   *                          or perform an action based on parameters.
   */
  run(message) {
    let query = message.strippedContent.match(this.regex)[1];
    message.channel.send('', { embed: inProgressEmbed })
      .then((sentMessage) => {
        if (!query) {
          return sentMessage.edit('', { embed: noResultsEmbed });
        }
        return this.bot.caches.dropCache.getData()
          .then((data) => {
            const results = data
              .filter(entry => entry.item.toLowerCase().indexOf(query.toLowerCase()) > -1)
              .sort(itemSort);
            const longestName = results.map(result => result.item)
              .reduce((a, b) => (a.length > b.length ? a : b));
            const longestRelic = results.map(result => result.place)
              .reduce((a, b) => (a.length > b.length ? a : b));
            query = toTitleCase(query.trim());
            createGroupedArray(results, 40).forEach((group, index) => {
              const embed = new WhereisEmbed(this.bot, createGroupedArray(group, 4), 
                query, longestName.length, longestRelic.length);
              if (index === 0) {
                sentMessage.edit('', { embed });
              } else {
                this.messageManager.embed(sentMessage, embed, false, false);
              }
            });
          })
          .catch((error) => {
            this.logger.error(error);
            sentMessage.edit('', { embed: noResultsEmbed });
          });
      })
      .catch((e) => {
        this.logger.error(e);
      });
  }
}

module.exports = Whereis;
