import { Events } from 'discord.js';

import Handler from '../models/BaseEventHandler.js';

/**
 * Describes a handler
 */
export default class DeleteGuild extends Handler {
  /**
   * Construct handle
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'handlers.deleteGuild', Events.GuildDelete);
  }

  /**
   * delete channel from databse
   * @param {Discord.Guild} guild channel to delete from the database
   */
  async execute(...[guild]) {
    this.logger.debug(`Running ${this.id} for ${this.event}`);

    if (!guild.available) {
      return;
    }
    await this.settings.removeGuild(guild);
    this.logger.debug(`Guild deleted : ${guild.name} (${guild.id})`);
  }
}
