import { Events } from 'discord.js';

import { games } from '#shared/utilities/CommonFunctions';

import type Genesis from '../bot';
import Handler from '../models/BaseEventHandler';

export default class LeaveNotify extends Handler {
  constructor(bot: Genesis) {
    super(bot, 'handlers.server.leave', Events.GuildDelete);
  }

  async execute(...[guild]) {
    if (!games.includes('LOGGING')) return;
    this.logger.debug(`Running ${this.id} for ${this.event}. Params: ${guild}`);
    const bots = guild.members.cache.filter((member) => member.user.bot);
    const owner = await guild.fetchOwner();
    const tokens = [
      `${guild.name} (${guild.id})`,
      owner ? `**Owner:** ${owner.user.username} (${guild.ownerId})` : '',
      `**Members:** ${guild.memberCount}`,
      `**Bots:** ${bots.size}`,
      `**Percent:** ${((bots.size / guild.memberCount) * 100).toFixed(2)}%`,
      `**Created:** ${guild.createdAt.toLocaleString('en-US', { timeZone: 'America/Chicago' })}`,
    ];
    try {
      this.bot.controlHook.send({
        embeds: [
          {
            color: 0x660000,
            title: 'Left Server',
            description: tokens.filter((a) => a).join('\n'),
            thumbnail: {
              url: guild.iconURL(),
            },
            footer: {
              text: guild.id,
            },
            timestamp: new Date().toISOString(),
          },
        ],
      });
    } catch (e) {
      this.bot.logger.error(e);
    }
  }
}
