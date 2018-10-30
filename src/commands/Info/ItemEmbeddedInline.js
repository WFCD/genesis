'use strict';

const Wikia = require('node-wikia');
const request = require('request-promise');

const Command = require('../../models/InlineCommand.js');
const FrameEmbed = require('../../embeds/FrameEmbed.js');
const WeaponEmbed = require('../../embeds/WeaponEmbed.js');
const WikiEmbed = require('../../embeds/WikiEmbed.js');
const { apiBase, assetBase } = require('../../CommonFunctions');

const warframe = new Wikia('warframe');

const ancientRetributionThumb = `${assetBase}/img/ancient-retribution.png`;

const checkFrames = async (prompt) => {
  const options = {
    uri: `${apiBase}/warframes/search/${prompt}`,
    json: true,
    rejectUnauthorized: false,
  };
  const results = await request(options);
  if (results.length > 0) {
    return new FrameEmbed(this.bot, results[0]);
  }
  return undefined;
};

const checkWeapons = async (prompt) => {
  const options = {
    uri: `${apiBase}/weapons/search/${prompt}`,
    json: true,
    rejectUnauthorized: false,
  };
  const results = await request(options);
  if (results.length > 0) {
    return new WeaponEmbed(this.bot, results[0]);
  }
  return undefined;
};

const checkWikia = async (prompt) => {
  try {
    const articles = await warframe.getSearchList({
      query: prompt,
      limit: 1,
    });
    const details = await warframe.getArticleDetails({
      ids: articles.items.map(i => i.id),
    });
    return new WikiEmbed(this.bot, details, true);
  } catch (e) {
    return undefined;
  }
};

const checkMods = async (prompt) => {
  try {
    const searchJson = await warframe.getSearchList({ query: prompt, limit: 1 });
    const [{ id }] = searchJson.items;
    const detailsJson = await warframe.getArticleDetails({ ids: [id] });
    let thumbUrl = detailsJson.items[`${id}`].thumbnail;
    thumbUrl = thumbUrl ? thumbUrl.replace(/\/revision\/.*/, '') : ancientRetributionThumb;
    const list = await warframe.getArticlesList({ category: 'Mods', limit: 1000 });
    let result;
    list.items.forEach((item) => {
      if (item.id === id) {
        result = {
          title: detailsJson.items[id].title,
          url: detailsJson.basepath + detailsJson.items[id].url,
          color: 0xC0C0C0,
          description: `Mod result for ${prompt}`,
          image: {
            url: thumbUrl,
          },
        };
      }
    });
    return result;
  } catch (e) {
    return undefined;
  }
};

/**
 * Displays the stats for a warframe
 */
class FrameStatsInline extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot The bot object
   */
  constructor(bot) {
    super(bot, 'warframe.info', '[Query]', 'Get stats for a Warframe');
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

    try {
      this.logger.debug(`Checking ${strippedQuery} for mod`);
      const modResult = await checkMods(query);
      this.logger.debug(`Checking ${strippedQuery} for frame`);
      const frameResult = await checkFrames(strippedQuery);
      this.logger.debug(`Checking ${strippedQuery} for weapon`);
      const weaponResult = await checkWeapons(strippedQuery);
      this.logger.debug(`Checking ${strippedQuery} from wiki`);
      const wikiResult = await checkWikia(query);

      if (modResult && modResult.title.toLowerCase() === strippedQuery.toLowerCase()) {
        this.messageManager.embed(message, modResult, false, true);
        return this.messageManager.statuses.SUCCESS;
      }

      if (frameResult) {
        this.messageManager.embed(message, frameResult, false, true);
        return this.messageManager.statuses.SUCCESS;
      }

      if (weaponResult) {
        this.messageManager.embed(message, weaponResult, false, true);
        return this.messageManager.statuses.SUCCESS;
      }

      if (wikiResult) {
        this.messageManager.embed(message, wikiResult, false, true);
        return this.messageManager.statuses.SUCCESS;
      }
    } catch (error) {
      this.logger.error(JSON.stringify(error));
      this.logger.error(error);
    }

    return this.messageManager.statuses.FAILURE;
  }

  /**
   * Run the commandW
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
