'use strict';

const { Events } = require('discord.js').Constants;

const { games } = require('../CommonFunctions');

module.exports = class UpdateGuildStatistics extends require('../models/BaseEventHandler') {
  constructor(bot) {
    super(bot, 'handlers.statsupdate', Events.GUILD_MEMBER_UPDATE);
  }

  async execute(...[, newMember]) {
    if (!games.includes('UTIL')) return;
    this.logger.debug(`Running ${this.id} for ${this.event}. Params: ${newMember.guild}`);

    const { guild } = newMember;
    const mappedRoles = await this.settings.getTrackedRoles(guild);

    guild.roles.cache
      .filter(r => Object.keys(mappedRoles).includes(r.id))
      .each((role) => {
        const channel = guild.channels.cache.get(mappedRoles[role.id]);
        if (channel.permissionsFor(this.bot.client.user).has(['MANAGE_CHANNELS', 'MANAGE_ROLES'])) {
          channel.setName(`${role.name} :: ${role.members.size}`);
        } else {
          this.logger.debug(`bot doesn't have permissions to update ${channel.id}`);
        }
      });
  }
};
