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

    try {
      this.bot.controlHook.send({
        embeds: [{
          color: 0x00d62e,
          title: 'Left Server',
          description: `Left: ${guild.name}\nID: ${guild.id}`,
          thumbnail: {
            url: guild.iconURL,
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
