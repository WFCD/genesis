'use strict';

const request = require('request-promise');
const Command = require('../../models/Command.js');
const WeaponEmbed = require('../../embeds/WeaponEmbed.js');
const ComponentEmbed = require('../../embeds/ComponentEmbed.js');
const PatchnotesEmbed = require('../../embeds/PatchnotesEmbed.js');
const { createPageCollector, apiBase, createGroupedArray } = require('../../CommonFunctions');


/**
 * Displays the stats for a warframe
 */
class WeaponStats extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot The bot object
   */
  constructor(bot) {
    super(bot, 'warframe.misc.weaponstats', 'weapon', 'Get stats for a weapon');
    this.regex = new RegExp(`^${this.call}\\s?(.+)?`, 'i');
    this.usages = [
      {
        description: 'Get stats for a Warframe',
        parameters: ['weapon name'],
      },
    ];
  }

  /**
   * Run the command
   * @param {Message} message Message with a command to handle, reply to,
   *                          or perform an action based on parameters.
   * @returns {string} success status
   */
  async run(message) {
    let weapon = message.strippedContent.match(this.regex)[1];
    if (weapon) {
      weapon = weapon.trim().toLowerCase();
      const options = {
        uri: `${apiBase}/weapons/search/${weapon}`,
        json: true,
        rejectUnauthorized: false,
      };
      try {
        const results = await request(options);
        if (results.length > 0) {
          const pages = [];
          results.forEach((result) => {
            pages.push(new WeaponEmbed(this.bot, result));
            if (result.components && result.components.length) {
              pages.push(new ComponentEmbed(this.bot, result.components));
            }
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
        this.messageManager.embed(message, new WeaponEmbed(this.bot, undefined), true, false);
        return this.messageManager.statuses.FAILURE;
      } catch (e) {
        this.logger.error(e);
        this.messageManager.embed(message, new WeaponEmbed(this.bot, undefined), true, false);
        return this.messageManager.statuses.FAILURE;
      }
    }
    this.messageManager.embed(message, new WeaponEmbed(this.bot, undefined), true, false);
    return this.messageManager.statuses.FAILURE;
  }
}

module.exports = WeaponStats;
