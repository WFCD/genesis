'use strict';

const Handler = require('../models/BaseEventHandler');

/**
 * Describes a handler
 */
class LogMessageDelete extends Handler {
  /**
   * Base class for bot commands
   * @param {Genesis} bot  The bot object
   * @param {string}  id   The command's unique id
   * @param {string}  event Event to trigger this handler
   */
  constructor(bot) {
    super(bot, 'handlers.logMessageDelete', 'messageDelete');
  }

  /**
   * add the guild to teh Database
   * @param {Discord.Message} message member to add roles to
   */
  async execute(...[message]) {
    let logChannel = this.settings.getGuildSetting(message.guild, 'msgDeleteLog');
    if (message.guild.channels.has(logChannel)) {
      logChannel = message.guild.channels.get(logChannel);
    } else {
      logChannel = undefined;
    }
    this.logger.debug(`Message to delete: ${message}\n\nLogged in: ${logChannel}`);
    if (logChannel && logChannel.type === 'text') {
      logChannel.send({
        embed: {
          title: 'Message Delete',
          color: 0xFF5A36,
          fields: [
            {
              name: 'Channel',
              value: message.channel,
            },
            {
              name: '_ _',
              value: message.cleanContent.length > 1024 ?
                `${message.cleanContent.slice(1020, message.cleanContent.length)}...` :
                message.cleanContent,
            },
          ],
        },
      });
    }
  }
}

module.exports = LogMessageDelete;
