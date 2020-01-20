'use strict';

const { games } = require('../CommonFunctions');

class UpdateGuildStatistics extends require('../models/BaseEventHandler') {
  constructor(bot) {
    super(bot, 'handlers.statsupdate', 'guildMemberUpdate');
  }

  async execute(...[, newMember]) {
    if (!games.includes('UTIL')) return;
    this.logger.debug(`Running ${this.id} for ${this.event}. Params: ${newMember.guild}`);

    const { guild } = newMember;
    const mappedRoles = await this.settings.getTrackedRoles(guild);

    guild.roles
      .filter(r => Object.keys(mappedRoles).includes(r.id))
      .each((role) => {
        const channel = guild.channels.get(mappedRoles[role.id]);
        channel.setName(`${role.name} :: ${role.members.size}`);
      });
  }
}

module.exports = UpdateGuildStatistics;
