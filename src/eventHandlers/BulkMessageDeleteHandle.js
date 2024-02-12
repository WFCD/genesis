import Discord from 'discord.js';

import Handler from '../models/BaseEventHandler.js';
import LogEmbed from '../embeds/LogEmbed.js';
import webhook from '../utilities/Webhook.js'; // eslint-disable-line import/no-named-as-default
import { games } from '../utilities/CommonFunctions.js';

const { Events } = Discord.Constants;

/**
 * Describes a handler
 */
export default class LogMessageDelete extends Handler {
  /**
   * Base class for bot commands
   * @param {Genesis} bot  The bot object
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
        color: 0xff5a36,
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
      await webhook({ channel }, { embeds: [log] });
    }
  }
}
