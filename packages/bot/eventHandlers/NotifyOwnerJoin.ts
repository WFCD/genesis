import { Events } from 'discord.js';

import { games } from '#shared/utilities/CommonFunctions';

import type Genesis from '../bot';
import Handler from '../models/BaseEventHandler';

export default class NotifyOwnerJoin extends Handler {
  channelTimeout: number;

  constructor(bot: Genesis) {
    super(bot, 'handlers.notifyowner', Events.GuildCreate);
    this.channelTimeout = 60000;
  }

  async execute(...[guild]) {
    if (!games.includes('LOGGING')) return;
    this.logger.debug(`Running ${this.id} for ${this.event}`);

    if (!guild.available) {
      return;
    }
    const bots = guild.members.cache.filter((member) => member.user.bot);
    const isOverLimit = (bots.size / guild.memberCount) * 100 >= 80;

    try {
      const owner = await guild.fetchOwner();
      if (!isOverLimit) {
        const prefix = await this.settings.channels.getSetting(guild.channels.cache.first(), 'prefix');
        owner.send(
          `${this.client.user.username} has been added ` +
            `to ${guild.name} and is ready\n Type ` +
            `\`${prefix}help\` for help`
        );
      } else {
        owner.send(
          `Your guild **${guild.name}** is over the bot-to-user ratio.\nGenesis will now leave.\nIf you want to keep using ${this.client.user.username} please invite more people or kick some bots.`
        );
        guild.leave();
      }
    } catch (e) {
      this.bot.logger.error(e);
    }
  }
}
