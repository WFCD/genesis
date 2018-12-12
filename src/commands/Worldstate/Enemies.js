'use strict';

const Command = require('../../models/Command.js');
const EnemyEmbed = require('../../embeds/EnemyEmbed.js');
const { captures } = require('../../CommonFunctions');

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
    this.regex = new RegExp(`^${this.call}s?(?:\\s+on\\s+${captures.platforms})?`, 'i');
  }

  async run(message, ctx) {
    const platformParam = message.strippedContent.match(this.regex)[1];
    const platform = platformParam || ctx.platform;
    const ws = await this.bot.worldStates[platform.toLowerCase()].getData();
    await this.messageManager.embed(
      message,
      new EnemyEmbed(this.bot, ws.persistentEnemies, platform), true, false,
    );
    return this.messageManager.statuses.SUCCESS;
  }
}

module.exports = Enemies;
