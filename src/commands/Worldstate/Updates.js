'use strict';

const Command = require('../../models/Command.js');
const NewsEmbed = require('../../embeds/NewsEmbed.js');
const { captures, setupPages } = require('../../CommonFunctions');

const updtReg = new RegExp(captures.updates, 'i');

/**
 * Displays the currently active Warframe update news
 */
class Updates extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot  The bot objectgratz
   *
   */
  constructor(bot) {
    super(bot, 'warframe.worldstate.updates', 'update', 'Display the currently active update news', 'WARFRAME');
    this.regex = new RegExp(`^${this.call}s?(?:(compact))?(?:\\s+on\\s+${captures.platforms})?$`, 'i');
  }

  async run(message, ctx) {
    const platformParam = message.strippedContent.match(this.regex)[1];
    const platform = platformParam || ctx.platform;
    const compact = /compact/ig.test(message.strippedContent);
    const news = (await this.ws.get('news', platform, ctx.language)).filter((n) => {
      this.bot.logger.debug(`${n.message} : ${updtReg.test(n.message)}`);
      return n.update || updtReg.test(n.message);
    }).reverse();

    if (compact) {
      const embed = new NewsEmbed(this.bot, news, undefined, platform);
      await message.reply({ embeds: [embed] });
    } else {
      const pages = [];
      news.forEach((article) => {
        pages.push(new NewsEmbed(this.bot, [article], undefined, platform));
      });
      await setupPages(pages, { message, settings: this.settings });
    }
    return this.constructor.statuses.SUCCESS;
  }
}

module.exports = Updates;
