import { ChannelType, Events } from 'discord.js';

import Handler from '../models/BaseEventHandler.js';
import LogEmbed from '../embeds/LogEmbed.js';
import { games } from '../utilities/CommonFunctions.js';
import webhook from '../utilities/Webhook.js'; // eslint-disable-line import/no-named-as-default

/**
 * Describes a handler
 */
export default class LogMemberBan extends Handler {
  /**
   * Base class for bot commands
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'handlers.logBanAdd', Events.GuildBanAdd);
  }

  /**
   * @param {Discord.Guild} guild guild that member was banned from
   * @param {Discord.User} user user that was banned
   */
  async execute(...[guild, user]) {
    if (!games.includes('LOGGING')) return;
    this.logger.debug(`Running ${this.id} for ${this.event}`);
    let logChannel = await this.settings.getGuildSetting(guild, 'banLog');
    if (guild.channels.cache.has(logChannel)) {
      logChannel = guild.channels.cache.get(logChannel);
    } else {
      logChannel = undefined;
    }
    if (logChannel && logChannel.type === ChannelType.GuildText) {
      const log = new LogEmbed(this.bot, {
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
