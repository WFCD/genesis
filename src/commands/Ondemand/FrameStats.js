'use strict';

const Command = require('../../Command.js');
const FrameEmbed = require('../../embeds/FrameEmbed.js');
const request = require('request-promise');

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
    const options = {
      uri: 'https://api.warframestat.us/warframes',
      json: true,
      rejectUnauthorized: false,
    };
    if (frame) {
      frame = frame.trim().toLowerCase();
      options.uri = `https://api.warframestat.us/warframes?search=${frame}`;
      const results = await request(options);
      if (results.length > 0) {
        this.messageManager.embed(message, new FrameEmbed(this.bot, results[0]), true, false);
        return this.messageManager.statuses.SUCCESS;
      }
      options.uri = 'https://api.warframestat.us/warframes';
      const frames = await request(options);
      this.messageManager.embed(message, new FrameEmbed(this.bot, undefined, frames), true, false);
      return this.messageManager.statuses.FAILURE;
    }
    const frames = await request(options);
    this.messageManager.embed(message, new FrameEmbed(this.bot, undefined, frames), true, false);
    return this.messageManager.statuses.FAILURE;
  }
}

module.exports = FrameStats;
