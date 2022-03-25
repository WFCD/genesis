import Discord from 'discord.js';
import Handler from '../models/BaseEventHandler.js';
import LogEmbed from '../embeds/LogEmbed.js';
import { games } from '../utilities/CommonFunctions.js';
import webhook from '../utilities/Webhook.js'; // eslint-disable-line import/no-named-as-default

const { Events } = Discord.Constants;

/**
 * Describes a handler
 */
export default class LogMemberUnban extends Handler {
  /**
   * Base class for bot commands
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'handlers.logBanRemove', Events.GUILD_BAN_REMOVE);
  }

  /**
   * @param {Discord.Guild} guild guild that member was banned from
   * @param {Discord.User} user user that was banned
   */
  async execute(...[guild, user]) {
    if (!games.includes('LOGGING')) return;
    this.logger.debug(`Running ${this.id} for ${this.event}`);

    let logChannel = await this.settings.getGuildSetting(guild, 'unbanLog');
    if (guild.channels.cache.has(logChannel)) {
      logChannel = guild.channels.cache.get(logChannel);
    } else {
      logChannel = undefined;
    }
    if (logChannel && logChannel.type === 'GUILD_TEXT') {
      const log = new LogEmbed(this.bot, {
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
