import { Events } from 'discord.js';

import { games } from '#shared/utilities/CommonFunctions';

import type Genesis from '../bot';
import Handler from '../models/BaseEventHandler';

export default class AssignDefaultRolesHandle extends Handler {
  constructor(bot: Genesis) {
    super(bot, 'handlers.assignDefaultRoles', Events.GuildMemberAdd);
  }

  async execute(...[member]) {
    if (!games.includes('UTIL')) return;
    this.logger.debug(`Running ${this.id} for ${this.event}`);

    const defaultRoles = JSON.parse(
      ((await this.settings.channels.getGuildSetting(member.guild, 'defaultRoles')) as string) || '[]'
    )
      .map((roleId: string) => member.guild.roles.cache.get(roleId))
      .filter((role: unknown) => role);
    if (defaultRoles.length) {
      await member.roles.add(defaultRoles, `Default role assignment for ${member.user.tag}`);
    }
  }
}
