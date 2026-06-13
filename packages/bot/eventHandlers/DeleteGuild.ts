import { Events } from 'discord.js';

import type Genesis from '../bot';
import Handler from '../models/BaseEventHandler';

export default class DeleteGuild extends Handler {
  constructor(bot: Genesis) {
    super(bot, 'handlers.deleteGuild', Events.GuildDelete);
  }

  async execute(...[guild]) {
    this.logger.debug(`Running ${this.id} for ${this.event}`);

    if (!guild.available) {
      return;
    }
    await this.settings.guilds.removeGuild(guild);
    this.logger.debug(`Guild deleted : ${guild.name} (${guild.id})`);
  }
}
