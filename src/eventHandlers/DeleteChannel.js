import Discord from 'discord.js';

import Handler from '../models/BaseEventHandler.js';

const { Events } = Discord.Constants;

/**
 * Describes a handler
 */
export default class DeleteChannel extends Handler {
  /**
   * Construct handle
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'handlers.deleteChannel', Events.CHANNEL_DELETE);
  }

  /**
   * delete channel from databse
   * @param {Discord.Channel} channel channel to delete from the database
   */
  async execute(...[channel]) {
    this.logger.debug(`Running ${this.id} for ${this.event}`);

    if (channel.type === 'GUILD_VOICE') {
      return;
    }
    await this.settings.deleteChannel(channel);
    this.logger.debug(`Channel with id ${channel.id} deleted`);
  }
}
