'use strict';

const Command = require('../../Command.js');
const FrameEmbed = require('../../embeds/FrameEmbed.js');
const frames = require('../../resources/frames.json');

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
    this.regex = new RegExp(`${this.call}\\s?(.+)?`, 'i');
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
   */
  run(message) {
    let frame = message.strippedContent.match(this.regex)[1];
    if (frame) {
      frame = frame.trim().toLowerCase();
      const results = frames.filter(entry => new RegExp(entry.regex, 'ig').test(frame));
      if (results.length > 0) {
        this.messageManager.embed(message, new FrameEmbed(this.bot, results[0]), true, false);
      } else {
        this.messageManager.embed(message, new FrameEmbed(this.bot, undefined), true, false);
      }
    } else {
      this.messageManager.embed(message, new FrameEmbed(this.bot, undefined), true, false);
    }
  }
}

module.exports = FrameStats;
