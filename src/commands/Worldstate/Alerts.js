'use strict';

const Command = require('../../models/Command.js');
const AlertEmbed = require('../../embeds/AlertEmbed.js');
const { captures, setupPages } = require('../../CommonFunctions');

/**
 * Displays the currently active alerts
 */
class Alerts extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'warframe.worldstate.alerts', 'alert', 'Display the currently active alerts', 'WARFRAME');
    this.regex = new RegExp(`^${this.call}s?\\s?(?:(compact))?\\s?(?:on\\s+${captures.platforms})?`, 'i');
  }

  async run(message, ctx) {
    const platformParam = message.strippedContent.match(new RegExp(captures.platforms, 'ig'));
    const compact = /compact/ig.test(message.strippedContent);
    const platform = platformParam && platformParam.length ? platformParam[0] : ctx.platform;
    const alerts = (await this.ws.get('alerts', platform, ctx.language)).filter(a => !a.expired);

    if (!alerts.length) {
      await message.reply({ content: ctx.i18n`No Alerts Active` });
    }

    if (compact) {
      const embed = new AlertEmbed(this.bot, alerts, platform, ctx.i18n);
      await message.reply({ embeds: [embed] });
    } else {
      const pages = [];
      alerts.forEach((alert) => {
        pages.push(new AlertEmbed(this.bot, [alert], platform, ctx.i18n));
      });
      await setupPages(pages, { message, settings: this.settings });
    }

    return this.constructor.statuses.SUCCESS;
  }
}

module.exports = Alerts;
