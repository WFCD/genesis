'use strict';

const fetch = require('node-fetch');

const Command = require('../../models/Command.js');
const FrameEmbed = require('../../embeds/FrameEmbed.js');
const ComponentEmbed = require('../../embeds/ComponentEmbed.js');
const PatchnotesEmbed = require('../../embeds/PatchnotesEmbed.js');
const { apiBase, createGroupedArray, createPageCollector } = require('../../CommonFunctions');

/**
 * Displays the stats for a warframe
 */
class FrameStats extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot The bot object
   */
  constructor(bot) {
    super(bot, 'warframe.misc.stats', 'frame', 'Get stats for a Warframe');
    this.regex = new RegExp(`^${this.call}\\s?(.+)?`, 'i');
    this.usages = [
      {
        description: 'Get stats for a Warframe',
        parameters: ['warframe name'],
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
    let frame = message.strippedContent.match(this.regex)[1];

    if (frame) {
      frame = frame.trim().toLowerCase();
      const results = await fetch(`${apiBase}/warframes/search/${frame}`).then(data => data.json());
      if (results.length > 0) {
        const pages = [];

        results.forEach((result) => {
          pages.push(new FrameEmbed(this.bot, result));
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
      const frames = await fetch(`${apiBase}/warframes`).then(data => data.json());
      this.messageManager.embed(message, new FrameEmbed(this.bot, undefined, frames), true, false);
      return this.messageManager.statuses.FAILURE;
    }
    const frames = await fetch(`${apiBase}/warframes`).then(data => data.json());
    this.messageManager.embed(message, new FrameEmbed(this.bot, undefined, frames), true, false);
    return this.messageManager.statuses.FAILURE;
  }
}

module.exports = FrameStats;
