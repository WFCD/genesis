import { Events } from 'discord.js';

import Handler from '../models/BaseEventHandler.js';
import { games } from '../utilities/CommonFunctions.js';

/**
 * Describes a handler
 */
export default class AssignDefaultRolesHandle extends Handler {
  /**
   * Base class for bot commands
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'handlers.assignDefaultRoles', Events.GuildMemberAdd);
  }

  /**
   * add the guild to teh Database
   * @param {Discord.GuildMember} member member to add roles to
   */
  async execute(...[member]) {
    if (!games.includes('UTIL')) return;
    this.logger.debug(`Running ${this.id} for ${this.event}`);

    const defaultRoles = JSON.parse((await this.settings.getGuildSetting(member.guild, 'defaultRoles')) || '[]')
      .map((roleId) => member.guild.roles.cache.get(roleId))
      .filter((role) => role);
    if (defaultRoles.length) {
      await member.roles.add(defaultRoles, `Default role assignment for ${member.user.tag}`);
    }
  }
}
