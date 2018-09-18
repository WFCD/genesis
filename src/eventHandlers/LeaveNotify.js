'use strict';

const Handler = require('../models/BaseEventHandler');

class LeaveNotify extends Handler {
  /**
   * Base class for bot commands
   * @param {Genesis} bot  The bot object
   * @param {string}  id   The command's unique id
   * @param {string}  event Event to trigger this handler
   */
  constructor(bot) {
    super(bot, 'handlers.server.leave', 'guildDelete');
  }

  /**
   * Run the handle
   * @param {GuildMember} member guildMember to welcome
   */
  async execute(...[guild]) {
    this.logger.debug(`Running ${this.id} for ${this.event}. Params: ${guild}`);
    const tokens = [
      `**Left:** ${guild.name}`,
      `**ID:** ${guild.id}`,
      `**Owner:** ${guild.owner.user.username}#${guild.owner.user.discriminator} (${guild.ownerID})`,
      `**Members:** ${guild.memberCount}`,
    ];
    try {
      this.bot.controlHook.send({
        embeds: [{
          color: 0x00d62e,
          title: 'Left Server',
          description: tokens.join('\n'),
          thumbnail: {
            url: guild.iconURL,
          },
          footer: {
            text: guild.id,
          },
          timestamp: new Date(),
        }],
      });
    } catch (e) {
      this.bot.logger.error(e);
    }
  }
}

module.exports = LeaveNotify;
