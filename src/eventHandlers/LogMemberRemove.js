import { Events } from 'discord.js';

import Handler from '../models/BaseEventHandler.js';
import LogEmbed from '../embeds/LogEmbed.js';
import { games } from '../utilities/CommonFunctions.js';
import webhook from '../utilities/Webhook.js'; // eslint-disable-line import/no-named-as-default

/**
 * Describes a handler
 */
export default class LogMemberRemove extends Handler {
  /**
   * Base class for bot commands
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'handlers.logMemberRemove', Events.GuildMemberRemove);
  }

  /**
   * @param {Discord.Message} message member that was remvoed, left, or kicked
   */
  async execute(...[member]) {
    if (!games.includes('LOGGING')) return;
    this.logger.debug(`Running ${this.id} for ${this.event}`);

    let logChannel = await this.settings.getGuildSetting(member.guild, 'memberRemoveLog');
    if (member.guild.channels.cache.has(logChannel)) {
      logChannel = member.guild.channels.cache.get(logChannel);
    } else {
      logChannel = undefined;
    }
    if (logChannel && logChannel.type === 'GUILD_TEXT') {
      const log = new LogEmbed(this.bot, {
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
