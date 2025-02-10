import { ChannelType, Events } from 'discord.js';

import Handler from '../models/BaseEventHandler.js';

/**
 * Describes a handler
 */
export default class AddChannelToDatabase extends Handler {
  constructor(bot) {
    super(bot, 'handlers.addChannel', Events.ChannelCreate);
  }

  // eslint-disable-next-line valid-jsdoc
  /**
   * add the guild to the Database
   * @param {Discord.channel} channel channel to add to the database
   */
  async execute(...[channel]) {
    this.logger.debug(`Running ${this.id} for ${this.event}`);

    if (channel.type === ChannelType.GuildVoice) {
      return;
    }
    if (channel.type === ChannelType.GuildText) {
      try {
        await this.settings.addGuildTextChannel(channel);
        this.logger.debug(
          `Text channel ${channel.name} (${channel.id}) created in guild ` +
            `${channel.guild.name} (${channel.guild.id})`
        );
      } catch (err) {
        await this.settings.addGuild(channel.guild);
        this.settings.addGuildTextChannel(channel);
      }
    } else if (channel.type === ChannelType.PublicThread || channel.type === ChannelType.PrivateThread) {
      if (channel.parentId) {
        await this.settings.addGuildTextChannel({ id: channel.parentId, guild: { id: channel.guild.id } });
      }
    }
  }
}
