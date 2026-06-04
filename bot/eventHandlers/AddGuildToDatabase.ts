import { Events } from 'discord.js';

import type Genesis from '../bot';
import Handler from '../models/BaseEventHandler';

export default class AddGuildToDatabase extends Handler {
  channelTimeout: number;

  constructor(bot: Genesis) {
    super(bot, 'handlers.addGuild', Events.GuildCreate);
    this.channelTimeout = 60000;
  }

  async execute(...[guild]) {
    this.logger.debug(`Running ${this.id} for ${this.event}`);

    if (!guild.available) {
      return;
    }
    await this.settings.guilds.addGuild(guild);
    this.logger.debug(`Joined guild ${guild} (${guild.id}`);
  }
}
