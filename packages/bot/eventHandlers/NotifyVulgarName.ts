import { Events } from 'discord.js';

import { games, isVulgarCheck } from '#shared/utilities/CommonFunctions';
import webhook from '#shared/utilities/Webhook';

import type Genesis from '../bot';
import Handler from '../models/BaseEventHandler';

export default class VulgarNameHandle extends Handler {
  constructor(bot: Genesis) {
    super(bot, 'handlers.vulgarCheck', Events.GuildMemberAdd);
  }

  async execute(...[member]) {
    if (!games.includes('LOGGING')) return;

    this.logger.debug(`Running ${this.id} for ${this.event}`);
    this.logger.debug(`Handling 'vulgarCheck' for ${member.id} on ${member.guild.name}`);

    const isVulgar = isVulgarCheck.test(member.displayName) || isVulgarCheck.test(member.user.username);
    const vulgarLogChannel = await this.settings.channels.getGuildSetting(member.guild, 'vulgarLog');
    if (isVulgar && member.guild.channels.cache.has(vulgarLogChannel)) {
      const modRole = await this.settings.channels.getGuildSetting(member.guild, 'modRole');
      const logChannel = member.guild.channels.cache.get(vulgarLogChannel);
      const text = `Operators ${
        member.guild.roles.cache.get(modRole) || 'gloriously handling moderation'
      }, user ${member} has a bad name.\n~~Destroy~~ Please take action accordingly.`;
      await webhook({ channel: logChannel }, { text });
    }
  }
}
