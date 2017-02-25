'use strict';

const Command = require('../../Command.js');
const EnemyEmbed = require('../../embeds/EnemyEmbed.js');

/**
 * Displays the currently persistent enemies
 */
class Enemies extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'warframe.worldstate.acolytes', 'acolyte', 'Display any currently active acolyte-style enemies.');
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
        const persistentEnemies = ws.persistentEnemies;
        this.messageManager.embed(message,
          new EnemyEmbed(this.bot, persistentEnemies), true, false);
      })
      .catch(this.logger.error);
  }
}

module.exports = Enemies;
