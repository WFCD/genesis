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
    this.regex = new RegExp(`^${this.call}s?(?:\\s+on\\s+([pcsxb14]{2,3}))?`, 'i');
  }

  /**
   * Run the command
   * @param {Message} message Message with a command to handle, reply to,
   *                          or perform an action based on parameters.
   */
  async run(message) {
    const platformParam = message.strippedContent.match(this.regex)[1];
    const platform = platformParam || await this.bot.settings.getChannelPlatform(message.channel);
    const ws = await this.bot.caches[platform].getDataJson();
    const alerts = ws.alerts.filter(a => !a.expired);
    await this.messageManager.embed(message, new AlertEmbed(this.bot, alerts), true, false);
  }
}

module.exports = Alerts;
