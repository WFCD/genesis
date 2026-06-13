import { ChannelType, Events, type Guild, type TextChannel, type User } from 'discord.js';

import LogEmbed from '#shared/embeds/LogEmbed';
import { games } from '#shared/utilities/CommonFunctions';
import webhook from '#shared/utilities/Webhook';

import Handler from '../models/BaseEventHandler';
import type Genesis from '../bot';

export default class LogMemberUnban extends Handler {
  constructor(bot: Genesis) {
    super(bot, 'handlers.logBanRemove', Events.GuildBanRemove);
  }

  async execute(...[guild, user]: [Guild, User]) {
    if (!games.includes('LOGGING')) return;
    this.logger.debug(`Running ${this.id} for ${this.event}`);

    const logChannelId = (await this.settings.channels.getGuildSetting(guild, 'unbanLog')) as string | undefined;
    let logChannel: TextChannel | undefined;
    if (logChannelId && guild.channels.cache.has(logChannelId)) {
      logChannel = guild.channels.cache.get(logChannelId) as TextChannel | undefined;
    }
    if (logChannel && logChannel.type === ChannelType.GuildText) {
      const log = new LogEmbed({
        color: 0x009900,
        title: 'Member Unbanned',
        fields: [
          {
            name: 'Member',
            value: `${user} • (${user.id})`,
          },
        ],
      });
      await webhook({ channel: logChannel }, { embeds: [log] });
    }
  }
}
