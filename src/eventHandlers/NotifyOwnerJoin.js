import { Events } from 'discord.js';

import Handler from '../models/BaseEventHandler.js';
import { games } from '../utilities/CommonFunctions.js';
/**
 * Describes a handler
 */
export default class NotifyOwnerJoin extends Handler {
  /**
   * Base class for bot commands
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'handlers.notifyowner', Events.GuildCreate);
    this.channelTimeout = 60000;
  }

  /**
   * add the guild to teh Database
   * @param {Discord.Guild} guild guild to add to the database
   */
  async execute(...[guild]) {
    if (!games.includes('LOGGING')) return;
    this.logger.debug(`Running ${this.id} for ${this.event}`);

    if (!guild.available) {
      return;
    }
    const bots = guild.members.cache.filter((member) => member.user.bot);
    const isOverLimit = (bots.size / guild.memberCount) * 100 >= 80;

    try {
      if (!isOverLimit) {
        const prefix = await this.settings.getChannelSetting(guild.channels.cache.first(), 'prefix');
        guild.owner.send(
          `${this.client.user.username} has been added ` +
            `to ${guild.name} and is ready\n Type ` +
            `\`${prefix}help\` for help`
        );
      } else {
        guild.owner.send(
          `Your guild **${guild.name}** is over the bot-to-user ratio.\nGenesis will now leave.\nIf you want to keep using ${this.client.user.username} please invite more people or kick some bots.`
        );
        guild.leave();
      }
    } catch (e) {
      this.bot.logger.error(e);
    }
  }
}
