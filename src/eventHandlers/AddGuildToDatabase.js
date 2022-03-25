import Discord from 'discord.js';
import Handler from '../models/BaseEventHandler.js';

const { Events } = Discord.Constants;

/**
 * Describes a handler
 */
export default class AddGuildToDatabase extends Handler {
  /**
   * Base class for bot commands
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'handlers.addGuild', Events.GUILD_CREATE);
    this.channelTimeout = 60000;
  }

  /**
   * add the guild to teh Database
   * @param {Discord.Guild} guild guild to add to the database
   */
  async execute(...[guild]) {
    this.logger.debug(`Running ${this.id} for ${this.event}`);

    if (!guild.available) {
      return;
    }
    await this.settings.addGuild([guild]);
    this.logger.debug(`Joined guild ${guild} (${guild.id}`);
  }
}
