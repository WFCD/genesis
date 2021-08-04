'use strict';

const { Events } = require('discord.js').Constants;

const Handler = require('../models/BaseEventHandler');
const { isVulgarCheck, games } = require('../CommonFunctions');

class VulgarNameHandle extends Handler {
  /**
   * Base class for bot commands
   * @param {Genesis} bot  The bot object
   * @param {string}  id   The command's unique id
   * @param {string}  event Event to trigger this handler
   */
  constructor(bot) {
    super(bot, 'handlers.vulgarCheck', Events.GUILD_MEMBER_ADD);
  }

  /**
   * Run the handle
   * @param {GuildMember} member guildMember to welcome
   */
  async execute(...[member]) {
    if (!games.includes('LOGGING')) return;

    this.logger.debug(`Running ${this.id} for ${this.event}`);
    this.logger.debug(`Handling 'vulgarCheck' for ${member.id} on ${member.guild.name}`);

    const isVulgar = isVulgarCheck.test(member.displayName)
      || isVulgarCheck.test(member.user.username);
    const vulgarLogChannel = await this.settings.getGuildSetting(member.guild, 'vulgarLog');
    if (isVulgar && member.guild.channels.cache.has(vulgarLogChannel)) {
      const modRole = await this.settings.getGuildSetting(member.guild, 'modRole');
      const logChannel = member.guild.channels.cache.get(vulgarLogChannel);
      const text = `Operators ${member.guild.roles.cache.get(modRole) || 'gloriously handling moderation'}, user ${member} has a bad name.\n~~Destroy~~ Please take action accordingly.`;
      await this.messageManager.webhook({ channel: logChannel }, { text });
    }
  }
}

module.exports = VulgarNameHandle;
