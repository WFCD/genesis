import { Events } from 'discord.js';

import { games } from '#shared/utilities/CommonFunctions';

import type Genesis from '../bot';
import Handler from '../models/BaseEventHandler';

export default class UpdateGuildStatistics extends Handler {
  constructor(bot: Genesis) {
    super(bot, 'handlers.statsupdate', Events.GuildMemberUpdate);
  }

  async execute(...[, newMember]) {
    if (!games.includes('UTIL')) return;
    this.logger.debug(`Running ${this.id} for ${this.event}. Params: ${newMember.guild}`);

    const { guild } = newMember;
    const mappedRoles = await this.settings.statistics.getTrackedRoles(guild);

    guild.roles.cache
      .filter((r) => Object.keys(mappedRoles).includes(r.id))
      .each((role) => {
        const channel = guild.channels.cache.get(mappedRoles[role.id]);
        if (channel.permissionsFor(this.bot.client.user).has(['MANAGE_CHANNELS', 'MANAGE_ROLES'])) {
          channel.setName(`${role.name} :: ${role.members.size}`);
        } else {
          this.logger.debug(`bot doesn't have permissions to update ${channel.id}`);
        }
      });
  }
}
