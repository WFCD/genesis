'use strict';

const Command = require('../../InlineCommand.js');
const FrameEmbed = require('../../embeds/FrameEmbed.js');
const WeaponEmbed = require('../../embeds/WeaponEmbed.js');
const WikiEmbed = require('../../embeds/WikiEmbed.js');
const Wikia = require('node-wikia');
const request = require('request-promise');

const warframe = new Wikia('warframe');

/**
 * Displays the stats for a warframe
 */
class FrameStatsInline extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot The bot object
   */
  constructor(bot) {
    super(bot, 'warframe.info', 'frame', 'Get stats for a Warframe');
    this.regex = new RegExp('\\[(.*?)\\]', 'ig');
    this.usages = [
      {
        description: 'Get stats for a Warframe',
        parameters: ['[warframe name]'],
      },
    ];
  }

  async evalQuery(message, query) {
    const strippedQuery = query.replace(/\[|\]/ig, '').trim().toLowerCase();
    const options = {
      uri: `https://api.warframestat.us/warframes/search/${strippedQuery}`,
      json: true,
      rejectUnauthorized: false,
    };
    let results = await request(options);
    if (results.length > 0) {
      this.messageManager.embed(message, new FrameEmbed(this.bot, results[0]), false, true);
      return this.messageManager.statuses.SUCCESS;
    }
    options.uri = `https://api.warframestat.us/weapons/search/${strippedQuery}`;
    results = await request(options);
    if (results.length > 0) {
      this.messageManager.embed(message, new WeaponEmbed(this.bot, results[0]), false, true);
      return this.messageManager.statuses.SUCCESS;
    }
    warframe.getSearchList({
      query: strippedQuery,
      limit: 1,
    })
      .then(articles => warframe.getArticleDetails({
        ids: articles.items.map(i => i.id),
      }))
      .then((details) => {
        this.messageManager.embed(message, new WikiEmbed(this.bot, details, true), false, true);
      })
      .catch(e => this.logger.error(e));
    return this.messageManager.statuses.SUCCESS;
  }

  /**
   * Run the command
   * @param {Message} message Message with a command to handle, reply to,
   *                          or perform an action based on parameters.
   * @returns {string} success status
   */
  async run(message) {
    const queries = message.strippedContent.match(this.regex);
    if (queries.length > 0) {
      queries.forEach(query => this.evalQuery(message, query));
    }
    return this.messageManager.statuses.FAILURE;
  }
}

module.exports = FrameStatsInline;
