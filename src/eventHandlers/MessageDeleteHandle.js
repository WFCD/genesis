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
    super(bot, 'handlers.logMessageDelete', Events.MESSAGE_DELETE);
  }

  /**
   * add the guild to teh Database
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
        color: 0xFF5A36,
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
            value: msg.length ? `\`\`\`${msg.replace(/`/g, '\\`')}\`\`\`` : '```diff\n- Message was either empty or an embed```',
          },
        ],
        footer: message.id,
      });
      await this.messageManager.webhook({ channel: logChannel }, { embed: log });
    }
  }
}

module.exports = LogMessageDelete;
