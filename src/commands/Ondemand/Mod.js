'use strict';

const request = require('request-promise');

const Command = require('../../models/Command.js');
const BaseEmbed = require('../../embeds/BaseEmbed.js');
const PatchnotesEmbed = require('../../embeds/PatchnotesEmbed.js');
const { createPageCollector, apiBase, createGroupedArray } = require('../../CommonFunctions');

class ModEmbed extends BaseEmbed {
  constructor(bot, modData, query) {
    super();

    this.title = modData.name;
    this.color = 0xC0C0C0;
    this.description = `Mod result for ${query}`;
    this.url = `https://warfarme.wikia.com/wiki/${modData.name.replace(/\s/ig, '_'}`;
    this.image = {
      url: `https://cdn.warframestat.us/img/${modData.imageName}`,
    };
  }
}

/**
 * Displays mods from the wiki
 */
class Mod extends Command {
	/**
	 * Constructs a callable command
	 * @param {Genesis} bot  The bot object
	 */
	constructor(bot) {
		super(bot, 'warframe.misc.mod', 'mod', 'Search the Warframe Wiki for a mod\'s image');
		this.regex = new RegExp('^mod(.+)', 'i');
		this.noResultStr = `${this.md.codeMulti}No result for search, Operator. Attempt another search query.${this.md.blockEnd}`;
	}

	/**
	 * Run the command
	 * @param {Message} message Message with a command to handle, reply to,
	 *                          or perform an action based on parameters.
	 * @returns {string} success status
	 */
	async run(message) {
		const query = this.regex.exec(message.strippedContent.match(this.regex)[0])[1];
		if (!query) {
			this.messageManager.reply(message, this.noResultStr, true, false);
			return this.messageManager.statuses.FAILURE;
		}
    
    const options = {
      uri: `${apiBase}/mods/search/${query}`,
      json: true,
      rejectUnauthorized: false,
    };
    try {
      const results = await request(options);
      if (results.length > 0) {
        const pages = [];
        results.forEach((result) => {
          pages.push(new ModEmbed(this.bot, result, query));
          if (result.patchlogs && result.patchlogs.length) {
            createGroupedArray(result.patchlogs, 4).forEach((patchGroup) => {
              pages.push(new PatchnotesEmbed(this.bot, patchGroup));
            });
          }
        });

        const msg = await this.messageManager.embed(message, pages[0], true, false);
        await createPageCollector(msg, pages, message.author);
        return this.messageManager.statuses.SUCCESS;
      }
      this.messageManager.reply(message, this.noResultStr, true, false);
      return this.messageManager.statuses.FAILURE;
    } catch (e) {
      this.logger.error(e);
      this.messageManager.reply(message, this.noResultStr, true, false);
      return this.messageManager.statuses.FAILURE;
    }
	}
}

module.exports = Mod;
