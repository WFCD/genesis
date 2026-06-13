import { ChannelType, Events, type Message, type TextChannel } from 'discord.js';

import LogEmbed from '#shared/embeds/LogEmbed';
import { games } from '#shared/utilities/CommonFunctions';
import webhook from '#shared/utilities/Webhook';

import Handler from '../models/BaseEventHandler';
import type Genesis from '../bot';

export default class LogMessageDelete extends Handler {
  constructor(bot: Genesis) {
    super(bot, 'handlers.logMessageDelete', Events.MessageDelete);
  }

  async execute(...[message]: [Message]) {
    if (!games.includes('LOGGING')) return;
    this.logger.debug(`Running ${this.id} for ${this.event}`);

    const logChannelId = (await this.settings.channels.getGuildSetting(message.guild, 'msgDeleteLog')) as
      | string
      | undefined;
    let logChannel: TextChannel | undefined;
    if (message.guild && logChannelId && message.guild.channels.cache.has(logChannelId)) {
      logChannel = message.guild.channels.cache.get(logChannelId) as TextChannel | undefined;
    }
    if (logChannel && logChannel.type === ChannelType.GuildText) {
      let msg;
      if (message.content.length > 1024) {
        msg = `${message.content.slice(1020, message.content.length)}...`;
      } else {
        msg = message.content;
      }
      const log = new LogEmbed({
        color: 0xff5a36,
        title: 'Message Delete',
        fields: [
          {
            name: 'Channel',
            value: `${message.channel} • ${message.channel.id}`,
          },
          {
            name: 'Author',
            value: `${message.author} • ${message.author.id}`,
          },
          {
            name: '\u200B',
            value: msg.length
              ? `\`\`\`${msg.replace(/`/g, '\\`')}\`\`\``
              : '```diff\n- Message was either empty or an embed```',
          },
        ],
        footer: message.id,
      });
      await webhook({ channel: logChannel }, { embeds: [log] });
    }
  }
}
