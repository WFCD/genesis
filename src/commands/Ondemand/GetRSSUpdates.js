'use strict';

const Command = require('../../models/Command.js');
const RSSEmbed = require('../../embeds/RSSEmbed.js');
const feeds = require('../../resources/rssFeeds');
const { setupPages } = require('../../CommonFunctions');

/**
 * Displays the most recent RSS Update for the current platform
 */
class GetRSSUpdates extends Command {
  constructor(bot) {
    super(bot, 'rss.update', 'fupdates', 'Display themost recent RSS Update entries', 'WARFRAME');
  }

  async run(message, ctx) {
    const feedUrl = feeds.filter(f => f.key === `forum.updates.${ctx.platform}`)[0].url;
    const matchingFeeds = this.bot.feedNotifier.feeder.list.filter(f => f.url === feedUrl);
    const updates = matchingFeeds && matchingFeeds[0]
        && matchingFeeds[0].items && matchingFeeds[0].items[0]
      ? [...matchingFeeds[0].items]
      : [];
    if (!updates.length) {
      this.messageManager.reply(message, ctx.i18n`No RSS Updates`, true, true);
      return this.messageManager.statuses.FAILURE;
    }

    const pages = [];
    updates.reverse().forEach((item) => {
      pages.push(new RSSEmbed(item, feeds[0]));
    });
    await setupPages(pages, { message, settings: this.settings, mm: this.messageManager });

    return this.messageManager.statuses.SUCCESS;
  }
}

module.exports = GetRSSUpdates;
