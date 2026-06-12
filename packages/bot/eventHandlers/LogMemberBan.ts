import { ChannelType, Events, type Guild, type TextChannel, type User } from 'discord.js';

import LogEmbed from '#shared/embeds/LogEmbed';
import { games } from '#shared/utilities/CommonFunctions';
import webhook from '#shared/utilities/Webhook';

import Handler from '../models/BaseEventHandler';
import type Genesis from '../bot';

export default class LogMemberBan extends Handler {
  constructor(bot: Genesis) {
    super(bot, 'handlers.logBanAdd', Events.GuildBanAdd);
  }

  async execute(...[guild, user]: [Guild, User]) {
    if (!games.includes('LOGGING')) return;
    this.logger.debug(`Running ${this.id} for ${this.event}`);
    const logChannelId = (await this.settings.channels.getGuildSetting(guild, 'banLog')) as string | undefined;
    let logChannel: TextChannel | undefined;
    if (logChannelId && guild.channels.cache.has(logChannelId)) {
      logChannel = guild.channels.cache.get(logChannelId) as TextChannel | undefined;
    }
    if (logChannel && logChannel.type === ChannelType.GuildText) {
      const log = new LogEmbed({
        color: 0xcc0000,
        title: 'Member Banned',
        fields: [
          {
            name: 'Member',
            value: `${user} • ${user.id}`,
          },
        ],
      });
      await webhook({ channel: logChannel }, { embeds: [log] });
    }
  }
}
