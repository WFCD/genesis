'use strict';

const fetch = require('../../resources/Fetcher');

const Command = require('../../models/Command.js');
const PatchnotesEmbed = require('../../embeds/PatchnotesEmbed.js');
const ModEmbed = require('../../embeds/ModEmbed.js');
const { setupPages, apiBase, createGroupedArray } = require('../../CommonFunctions');

/**
 * Displays mods from the wiki
 */
class Mod extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'warframe.misc.mod', 'mod', 'Search the Warframe Wiki for a mod\'s image', 'WARFRAME');
    // Should match "/mod blind rage, for example"
    this.regex = new RegExp('^mod (.+)', 'i');
    this.noResultStr = '```haskell\nNo result for search, Operator. Attempt another search query.```';
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

    try {
      // Need to search in all lower case. "Blind Rage = blind rage"
      let url = `${apiBase}/mods/search/${query.toLowerCase()}`;
      const results = await fetch(url);
      if (results.length > 0) {
        const pages = [];
        results.forEach((result) => {
          pages.push(new ModEmbed(this.bot, result));
          if (result.patchlogs && result.patchlogs.length) {
            createGroupedArray(result.patchlogs, 4).forEach((patchGroup) => {
              pages.push(new PatchnotesEmbed(this.bot, patchGroup));
            });
          }
        });

        await setupPages(pages, { message, settings: this.settings, mm: this.messageManager });
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
