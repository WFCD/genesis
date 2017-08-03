'use strict';

const Command = require('../../InlineCommand.js');
const FrameEmbed = require('../../embeds/FrameEmbed.js');
const frames = require('../../resources/frames.json');
const WikiEmbed = require('../../embeds/WikiEmbed.js');
const Wikia = require('node-wikia');

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
    super(bot, 'warframe.misc.info', 'frame', 'Get stats for a Warframe');
    this.regex = new RegExp('\\[[a-zA-z\\s\']*\\]', 'ig');
    this.usages = [
      {
        description: 'Get stats for a Warframe',
        parameters: ['[warframe name]'],
      },
    ];
  }

  /**
   * Run the command
   * @param {Message} message Message with a command to handle, reply to,
   *                          or perform an action based on parameters.
   */
  run(message) {
    let query = message.strippedContent.match(this.regex)[0];
    if (query) {
      query = query.replace(/\[|\]`/ig, '').trim().toLowerCase();
      const results = frames.filter(entry => new RegExp(entry.regex, 'ig').test(query));
      if (results.length > 0) {
        this.messageManager.embed(message, new FrameEmbed(this.bot, results[0]), false, true);
      } else {
        warframe.getSearchList({
          query,
          limit: 1,
        }).then(articles => warframe.getArticleDetails({
          ids: articles.items.map(i => i.id),
        })).then((details) => {
          this.messageManager.embed(message, new WikiEmbed(this.bot, details, true), false, true);
        })
        .catch(e => this.logger.error(e));
      }
    }
  }
}

module.exports = FrameStatsInline;
