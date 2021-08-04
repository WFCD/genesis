'use strict';

const { Events } = require('discord.js').Constants;

const Handler = require('../models/BaseEventHandler');
const LogEmbed = require('../embeds/LogEmbed');
const { games } = require('../CommonFunctions');

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
    super(bot, 'handlers.logMessageDeleteBulk', Events.MESSAGE_DELETE_BULK);
  }

  /**
   * add the guild to teh Database
   * @param {Discord.Collection<Message>} messages member to add roles to
   */
  async execute(...[messages]) {
    if (!games.includes('LOGGING')) return;
    this.logger.debug(`Running ${this.id} for ${this.event}`);

    const first = messages.first();
    let channel = this.settings.getGuildSetting(messages.first().guild, 'messageDeleteLog');
    if (first.guild.channels.cache.has(channel)) {
      channel = first.guild.channels.cache.get(channel);
    } else {
      channel = undefined;
    }
    if (channel?.type === 'text') {
      const log = new LogEmbed(this.bot, {
        color: 0xFF5A36,
        title: 'Message Deleted',
        fields: [
          {
            name: 'Channel',
            value: `${first.channel} • ${first.channel.id}`,
          },
          {
            name: 'Number Deleted',
            value: messages.size,
          },
        ],
      });
      await this.messageManager.webhook({ channel }, { embeds: [log] });
    }
  }
}

module.exports = LogMessageDelete;
