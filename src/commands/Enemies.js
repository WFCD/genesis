'use strict';

const Command = require('../Command.js');
const EnemyEmbed = require('../embeds/EnemyEmbed.js');

/**
 * Displays the currently persistent enemies
 */
class Alerts extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'ondemand.enemies', 'enemies', 'Display any currently active acolyte-style enemies.');
  }

  /**
   * Run the command
   * @param {Message} message Message with a command to handle, reply to,
   *                          or perform an action based on parameters.
   */
  run(message) {
    this.bot.settings.getChannelPlatform(message.channel)
      .then(platform => this.bot.worldStates[platform].getData())
      .then((ws) => {
        const persistentEnemies = ws.persistentEnemies.filter(e => e.isDiscovered);
        return message.channel.sendEmbed(new EnemyEmbed(this.bot, persistentEnemies));
      }).then(() => {
        if (message.deletable) {
          return message.delete(2000);
        }
        return Promise.resolve();
      })
      .catch(this.logger.error);
  }
}

module.exports = Alerts;
