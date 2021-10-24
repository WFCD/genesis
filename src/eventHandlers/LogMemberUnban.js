'use strict';

const { Events } = require('discord.js').Constants;

const Handler = require('../models/BaseEventHandler');
const LogEmbed = require('../embeds/LogEmbed');
const { games } = require('../CommonFunctions');

/**
 * Describes a handler
 */
class LogMemberUnban extends Handler {
  /**
   * Base class for bot commands
   * @param {Genesis} bot  The bot object
   * @param {string}  id   The command's unique id
   * @param {string}  event Event to trigger this handler
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
      await this.messageManager.webhook({ channel: logChannel }, { embeds: [log] });
    }
  }
}

module.exports = LogMemberUnban;
