import Discord from 'discord.js';
import Handler from '../models/BaseEventHandler.js';
import { games } from '../utilities/CommonFunctions.js';

const { Events } = Discord.Constants;

export default class JoinNotify extends Handler {
  /**
   * Base class for bot commands
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'handlers.server.join', Events.GUILD_CREATE);
  }

  /**
   * Run the handle
   * @param {Discord.GuildMember} member guildMember to welcome
   */
  async execute(...[guild]) {
    if (!games.includes('LOGGING')) return;
    this.logger.debug(`Running ${this.id} for ${this.event}. Params: ${guild}`);
    const bots = guild.members.cache.filter((member) => member.user.bot);

    const tokens = [
      `${guild.name} (${guild.id})`,
      guild.owner ? `**Owner:** ${guild.owner.user.username}#${guild.owner.user.discriminator} (${guild.ownerID})` : '',
      `**Members:** ${guild.memberCount}`,
      `**Bots:** ${bots.size}`,
      `**Percent:** ${((bots.size / guild.memberCount) * 100).toFixed(2)}%`,
      `**Created:** ${guild.createdAt.toLocaleString('en-US', { timeZone: 'America/Chicago' })}`,
    ];
    try {
      this.bot.controlHook.send({
        embeds: [
          {
            color: 0x00d62e,
            title: 'Joined Server',
            description: tokens.filter((a) => a).join('\n'),
            thumbnail: {
              url: guild.iconURL(),
            },
            footer: {
              text: guild.id,
            },
            timestamp: new Date(),
          },
        ],
      });
    } catch (e) {
      this.bot.logger.error(e);
    }
  }
}
