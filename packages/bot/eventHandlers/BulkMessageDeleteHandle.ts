import { ChannelType, Events, type Collection, type Message, type TextChannel } from 'discord.js';

import LogEmbed from '#shared/embeds/LogEmbed';
import webhook from '#shared/utilities/Webhook';
import { games } from '#shared/utilities/CommonFunctions';

import Handler from '../models/BaseEventHandler';
import type Genesis from '../bot';

export default class LogMessageDelete extends Handler {
  constructor(bot: Genesis) {
    super(bot, 'handlers.logMessageDeleteBulk', Events.MessageBulkDelete);
  }

  async execute(...[messages]: [Collection<string, Message>]) {
    if (!games.includes('LOGGING')) return;
    this.logger.debug(`Running ${this.id} for ${this.event}`);

    const first = messages.first();
    if (!first?.guild) return;

    const logChannelId = (await this.settings.channels.getGuildSetting(first.guild, 'messageDeleteLog')) as
      | string
      | undefined;
    let channel: TextChannel | undefined;
    if (logChannelId && first.guild.channels.cache.has(logChannelId)) {
      channel = first.guild.channels.cache.get(logChannelId) as TextChannel | undefined;
    }
    if (channel?.type === ChannelType.GuildText) {
      const log = new LogEmbed({
        color: 0xff5a36,
        title: 'Message Deleted',
        fields: [
          {
            name: 'Channel',
            value: `${first.channel} • ${first.channel.id}`,
          },
          {
            name: 'Number Deleted',
            value: messages.size,
          },
        ],
      });
      await webhook({ channel }, { embeds: [log] });
    }
  }
}
