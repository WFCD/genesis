import { ChannelType, Events, type GuildMember, type TextChannel } from 'discord.js';

import LogEmbed from '#shared/embeds/LogEmbed';
import { games } from '#shared/utilities/CommonFunctions';
import webhook from '#shared/utilities/Webhook';

import Handler from '../models/BaseEventHandler';
import type Genesis from '../bot';

export default class LogMemberRemove extends Handler {
  constructor(bot: Genesis) {
    super(bot, 'handlers.logMemberRemove', Events.GuildMemberRemove);
  }

  async execute(...[member]: [GuildMember]) {
    if (!games.includes('LOGGING')) return;
    this.logger.debug(`Running ${this.id} for ${this.event}`);

    const logChannelId = (await this.settings.channels.getGuildSetting(member.guild, 'memberRemoveLog')) as
      | string
      | undefined;
    let logChannel: TextChannel | undefined;
    if (logChannelId && member.guild.channels.cache.has(logChannelId)) {
      logChannel = member.guild.channels.cache.get(logChannelId) as TextChannel | undefined;
    }
    if (logChannel && logChannel.type === ChannelType.GuildText) {
      const log = new LogEmbed({
        color: 0xffa500,
        title: 'Member Left/Kicked',
        fields: [
          {
            name: 'Member',
            value: `${member} • ${member.id}`,
          },
        ],
      });
      await webhook({ channel: logChannel }, { embeds: [log] });
    }
  }
}
