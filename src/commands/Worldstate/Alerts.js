'use strict';

const Command = require('../../models/Command.js');
const AlertEmbed = require('../../embeds/AlertEmbed.js');
const { createPageCollector, captures } = require('../../CommonFunctions');

/**
 * Displays the currently active alerts
 */
class Alerts extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'warframe.worldstate.alerts', 'alert', 'Display the currently active alerts');
    this.regex = new RegExp(`^${this.call}s?\\s?(?:(compact))?\\s?(?:on\\s+${captures.platforms})?`, 'i');
  }

  async run(message, ctx) {
    const platformParam = message.strippedContent.match(new RegExp(captures.platforms, 'ig'));
    const compact = /compact/ig.test(message.strippedContent);
    const platform = platformParam && platformParam.length ? platformParam[0] : ctx.platform;
    const ws = await this.bot.worldStates[platform.toLowerCase()].getData();
    const alerts = ws.alerts.filter(a => !a.expired);

    if (compact) {
      await this.messageManager
        .embed(message, new AlertEmbed(this.bot, alerts, platform, ctx.i18n), true, true);
    } else {
      const pages = [];
      alerts.forEach((alert) => {
        pages.push(new AlertEmbed(this.bot, [alert], platform, ctx.i18n));
      });
      if (pages.length) {
        const msg = await this.messageManager.embed(message, pages[0], false, false);
        await createPageCollector(msg, pages, message.author);
      }
      if (parseInt(await this.settings.getChannelSetting(message.channel, 'delete_after_respond'), 10) && message.deletable) {
        message.delete({ timeout: 10000 });
      }
    }

    return this.messageManager.statuses.SUCCESS;
  }
}

module.exports = Alerts;
