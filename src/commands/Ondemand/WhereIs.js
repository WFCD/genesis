'use strict';

const Query = require('warframe-location-query');
const Command = require('../../Command.js');

const extraSpace = '　　';

/**
 * Looks up locations of items
 */
class Whereis extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'warframe.misc.whereis', 'whereis', 'whereis');
    this.regex = new RegExp('^where(?:\\s?is)?(?:\\s+([\\w+\\s]+))?', 'i');

    this.usages = [
      {
        description: 'Display where an item drops',
        parameters: ['item'],
      },
    ];

    this.querier = new Query();
  }

  /**
   * Run the command
   * @param {Message} message Message with a command to handle, reply to,
   *                          or perform an action based on parameters.
   */
  run(message) {
    const item = message.strippedContent.match(this.regex)[1];
    this.querier.getAll(item)
      .then((results) => {
        const resultsHasResults = Object.prototype.toString.call(results) === '[object Array]' && results.length > 0;
        const color = resultsHasResults ? 0xD8F6ED : 0xBAA97C;
        const fields = resultsHasResults ? [] : [{ name: 'Operator, there is no such item location available.', value: '_ _' }];

        let slicedResults = [];
        let sliced = false;
        if (results.length > 4) {
          slicedResults = results.slice(0, 4);
          sliced = true;
        } else {
          slicedResults = results;
        }

        if (resultsHasResults) {
          slicedResults.forEach((result) => {
            fields.push({
              name: result.component + (result.type === 'Prime Part' ?
                ` worth ${result.ducats}` : ''),
              value: `${this.md.codeMulti}${extraSpace}${result.locations.join(`,${this.bot.md.lineEnd}${extraSpace}`).replace(/,,/g, ',')}${this.md.blockEnd}`,
            });
          });
        }

        if (sliced) {
          fields.push({ name: 'Your query returned more results than I can display, operator. Refine your search for more accurate results.', value: '_ _' });
        }

        const embed = {
          color,
          title: 'Warframe Where Is?',
          url: 'https://warframe.com',
          description: `Location query for ${item}`,
          fields,
          thumbnail: { url: 'http://vignette2.wikia.nocookie.net/warframe/images/1/1a/VoidProjectionsIronC.png' },
          footer: {
            icon_url: 'https://avatars1.githubusercontent.com/u/24436369',
            text: 'Data from the wiki',
          },
        };
        message.channel.sendEmbed(embed).then(this.logger.debug);
      })
      .catch(this.logger.error);
  }
}

module.exports = Whereis;
