import { Events } from 'discord.js';

import Handler from '../models/BaseEventHandler.js';
import LogEmbed from '../embeds/LogEmbed.js';
import { games } from '../utilities/CommonFunctions.js';
import webhook from '../utilities/Webhook.js'; // eslint-disable-line import/no-named-as-default

/**
 * Describes a handler
 */
export default class LogMessageDelete extends Handler {
  constructor(bot) {
    super(bot, 'handlers.logMessageDelete', Events.MessageDelete);
  }

  /**
   * add the guild to the Database
   * @param {Discord.Message} message member to add roles to
   */
  async execute(...[message]) {
    if (!games.includes('LOGGING')) return;
    this.logger.debug(`Running ${this.id} for ${this.event}`);

    let logChannel = await this.settings.getGuildSetting(message.guild, 'msgDeleteLog');
    if (message.guild && message.guild.channels.cache.has(logChannel)) {
      logChannel = message.guild.channels.cache.get(logChannel);
    } else {
      logChannel = undefined;
    }
    if (logChannel && logChannel.type === 'GUILD_TEXT') {
      let msg;
      if (message.content.length > 1024) {
        msg = `${message.content.slice(1020, message.content.length)}...`;
      } else {
        msg = message.content;
      }
      const log = new LogEmbed(this.bot, {
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
