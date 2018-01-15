'use strict';

const Command = require('../../Command.js');
const AlertEmbed = require('../../embeds/AlertEmbed.js');

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
    this.regex = new RegExp(`^${this.call}s?\\s?(?:(compact))?(?:on\\s+([pcsxb14]{2,3}))?`, 'i');
  }

  async run(message) {
    const matches = message.strippedContent.match(this.regex);
    const param1 = (matches[1] || '').toLowerCase();
    const param2 = (matches[2] || '').toLowerCase();
    const compact = /compact/ig.test(param1) || /compact/ig.test(param2);
    let platformParam;
    if (this.platforms.indexOf(param2) > -1) {
      platformParam = param2;
    } else if (this.platforms.indexOf(param1) > -1) {
      platformParam = param1;
    }

    const platform = platformParam || await this.bot.settings.getChannelSetting(message.channel, 'platform');
    const ws = await this.bot.caches[platform.toLowerCase()].getDataJson();
    const alerts = ws.alerts.filter(a => !a.expired);

    if (compact) {
      await this.messageManager
        .embed(message, new AlertEmbed(this.bot, alerts, platform), true, false);
    } else {
      await Promise.all(alerts.map(alert => this.messageManager
        .embed(message, new AlertEmbed(this.bot, [alert], platform), true, false)));
    }

    return this.messageManager.statuses.SUCCESS;
  }
}

module.exports = Alerts;
