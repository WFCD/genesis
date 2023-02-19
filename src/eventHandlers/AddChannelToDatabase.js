import Discord from 'discord.js';
import Handler from '../models/BaseEventHandler.js';

const { Events } = Discord.Constants;

/**
 * Describes a handler
 */
export default class AddChannelToDatabase extends Handler {
  constructor(bot) {
    super(bot, 'handlers.addChannel', Events.CHANNEL_CREATE);
  }

  // eslint-disable-next-line valid-jsdoc
  /**
   * add the guild to the Database
   * @param {Discord.Channel} channel channel to add to the database
   */
  async execute(...[channel]) {
    this.logger.debug(`Running ${this.id} for ${this.event}`);

    if (channel.type === 'GUILD_VOICE') {
      return;
    }
    if (channel.type === 'GUILD_TEXT') {
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
    } else if (channel.type === 'GUILD_PUBLIC_THREAD' || channel.type === 'GUILD_PRIVATE_THREAD') {
      if (channel.parentId) {
        await this.settings.addGuildTextChannel({ id: channel.parentId, guild: { id: channel.guild.id } });
      }
    }
  }
}
