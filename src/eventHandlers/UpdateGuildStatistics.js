import { Events, PermissionsBitField } from 'discord.js';

import { games } from '../utilities/CommonFunctions.js';
import Handler from '../models/BaseEventHandler.js';

export default class UpdateGuildStatistics extends Handler {
  constructor(bot) {
    super(bot, 'handlers.statsupdate', Events.GuildMemberUpdate);
  }

  async execute(...[, newMember]) {
    if (!games.includes('UTIL')) return;
    this.logger.debug(`Running ${this.id} for ${this.event}. Params: ${newMember.guild}`);

    const { guild } = newMember;
    const mappedRoles = await this.settings.getTrackedRoles(guild);

    guild.roles.cache
      .filter((r) => Object.keys(mappedRoles).includes(r.id))
      .each((role) => {
        const channel = guild.channels.cache.get(mappedRoles[role.id]);
        if (
          channel
            .permissionsFor(this.bot.client.user)
            .has([PermissionsBitField.Flags.ManageChannels, PermissionsBitField.Flags.ManageRoles])
        ) {
          channel.setName(`${role.name} :: ${role.members.size}`);
        } else {
          this.logger.debug(`bot doesn't have permissions to update ${channel.id}`);
        }
      });
  }
}
