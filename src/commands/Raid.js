'use strict';

const Cache = require('json-fetch-cache');
const RaidEmbed = require('../embeds/RaidEmbed.js');
const Command = require('../Command.js');

/**
 * Returns search results from the Warframe wiki
 */
class Raid extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'misc.raid', 'raid', 'Get the raid record for a desired user, or for the calling user');
    this.regex = new RegExp(`^${this.bot.escapedPrefix}(?:${this.call}s?|trials?)\\s*(.+)?`, 'i');
    this.usages = [
      {
        description: 'Search for a users\'s raid stats',
        parameters: ['username'],
      },
    ];
  }

  /**
   * Run the command
   * @param {Message} message Message with a command to handle, reply to,
   *                          or perform an action based on parameters.
   */
  run(message) {
    let query = message.cleanContent.match(this.regex)[1];
    if (!query || typeof query === 'undefined') {
      query = message.member ? message.member.displayName : message.author.username;
      query = query.replace('*', '');
    }
    this.logger.debug(`Searched for query: ${query}`);

    this.bot.settings.getChannelPlatform(message.channel)
      .then((platform) => {
        const url = encodeURI(`https://api.trials.wf/api/player/${platform.toLowerCase()}/${query}/completed`);
        const raidCache = new Cache(url, 999999);

        raidCache.getDataJson().then((data) => {
          const embed = new RaidEmbed(this.bot, data, query);
          return message.channel.sendEmbed(embed);
        });
      })
      .then(() => {
        if (message.deletable) {
          return message.delete(2000);
        }
        return Promise.resolve();
      })
      .catch(this.logger.error);
  }
}

module.exports = Raid;
