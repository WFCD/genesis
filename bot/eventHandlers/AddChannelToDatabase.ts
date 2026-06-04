import { ChannelType, Events } from 'discord.js';

import type Genesis from '../bot';
import Handler from '../models/BaseEventHandler';

export default class AddChannelToDatabase extends Handler {
  constructor(bot: Genesis) {
    super(bot, 'handlers.addChannel', Events.ChannelCreate);
  }

  async execute(...[channel]) {
    this.logger.debug(`Running ${this.id} for ${this.event}`);

    if (channel.type === ChannelType.GuildVoice) {
      return;
    }
    if (channel.type === ChannelType.GuildText) {
      try {
        await this.settings.guilds.addGuildTextChannel(channel);
        this.logger.debug(
          `Text channel ${channel.name} (${channel.id}) created in guild ` +
            `${channel.guild.name} (${channel.guild.id})`
        );
      } catch (err) {
        await this.settings.guilds.addGuild(channel.guild);
        this.settings.guilds.addGuildTextChannel(channel);
      }
    } else if (channel.type === ChannelType.PublicThread || channel.type === ChannelType.PrivateThread) {
      if (channel.parentId) {
        await this.settings.guilds.addGuildTextChannel({ id: channel.parentId, guild: { id: channel.guild.id } });
      }
    }
  }
}
