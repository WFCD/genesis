import { Events } from 'discord.js';

import Handler from '../models/BaseEventHandler.js';
import { games, isVulgarCheck } from '../utilities/CommonFunctions.js';
import webhook from '../utilities/Webhook.js';

export default class VulgarNameHandle extends Handler {
  /**
   * Base class for bot commands
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'handlers.vulgarCheck', Events.GuildMemberAdd);
  }

  /**
   * Run the handle
   * @param {Discord.GuildMember} member guildMember to welcome
   */
  async execute(...[member]) {
    if (!games.includes('LOGGING')) return;

    this.logger.debug(`Running ${this.id} for ${this.event}`);
    this.logger.debug(`Handling 'vulgarCheck' for ${member.id} on ${member.guild.name}`);

    const isVulgar = isVulgarCheck.test(member.displayName) || isVulgarCheck.test(member.user.username);
    const vulgarLogChannel = await this.settings.getGuildSetting(member.guild, 'vulgarLog');
    if (isVulgar && member.guild.channels.cache.has(vulgarLogChannel)) {
      const modRole = await this.settings.getGuildSetting(member.guild, 'modRole');
      const logChannel = member.guild.channels.cache.get(vulgarLogChannel);
      const text = `Operators ${
        member.guild.roles.cache.get(modRole) || 'gloriously handling moderation'
      }, user ${member} has a bad name.\n~~Destroy~~ Please take action accordingly.`;
      await webhook({ channel: logChannel }, { text });
    }
  }
}
