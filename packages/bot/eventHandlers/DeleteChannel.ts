import { ChannelType, Events } from 'discord.js';

import type Genesis from '../bot';
import Handler from '../models/BaseEventHandler';

export default class DeleteChannel extends Handler {
  constructor(bot: Genesis) {
    super(bot, 'handlers.deleteChannel', Events.ChannelDelete);
  }

  async execute(...[channel]) {
    this.logger.debug(`Running ${this.id} for ${this.event}`);

    if (channel.type === ChannelType.GuildVoice) {
      return;
    }
    await this.settings.guilds.deleteChannel(channel);
    this.logger.debug(`Channel with id ${channel.id} deleted`);
  }
}
