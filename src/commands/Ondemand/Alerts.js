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
    super(bot, 'warframe.worldstate.alerts', 'alerts', 'Display the currently active alerts');
  }

  /**
   * Run the command
   * @param {Message} message Message with a command to handle, reply to,
   *                          or perform an action based on parameters.
   */
  run(message) {
    this.bot.settings.getChannelPlatform(message.channel)
      .then(platform => this.bot.caches[platform].getDataJson())
      .then((ws) => {
        const alerts = ws.alerts.filter(a => !a.expired);
        this.messageManager.embed(message, new AlertEmbed(this.bot, alerts), true, false);
      })
      .catch(this.logger.error);
  }
}

module.exports = Alerts;
