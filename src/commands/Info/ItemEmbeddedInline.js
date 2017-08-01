'use strict';

const Command = require('../../InlineCommand.js');
const FrameEmbed = require('../../embeds/FrameEmbed.js');
const frames = require('../../resources/frames.json');

/**
 * Displays the stats for a warframe
 */
class FrameStatsInline extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot The bot object
   */
  constructor(bot) {
    super(bot, 'warframe.misc.info', 'frame', 'Get stats for a Warframe');
    this.regex = new RegExp(`\`\\[(${frames.map(frame => frame.regex).join('|')})\\]\``, 'ig');
    this.usages = [
      {
        description: 'Get stats for a Warframe',
        parameters: ['`[warframe name]``'],
      },
    ];
  }

  /**
   * Run the command
   * @param {Message} message Message with a command to handle, reply to,
   *                          or perform an action based on parameters.
   */
  run(message) {
    let frame = message.strippedContent.match(this.regex)[0];
    if (frame) {
      frame = frame.replace(/\[|\]`/ig, '').trim().toLowerCase();
      const results = frames.filter(entry => new RegExp(entry.regex, 'ig').test(frame));
      if (results.length > 0) {
        this.messageManager.embed(message, new FrameEmbed(this.bot, results[0]), false, true);
      }
    }
  }
}

module.exports = FrameStatsInline;
