'use strict';

const SQL = require('sql-template-strings');

class StatisticsQueries {
  constructor(db) {
    this.db = db;
  }

  async trackRole(guild, channel, role) {
    return this.query(SQL`
      INSERT IGNORE INTO role_stats
      (guild_id, channel_id, role_id)
      VALUES (${guild.id}, ${channel.id}, ${role.id})
    `);
  }

  async untrackRole(guild, role) {
    return this.query(SQL`
      DELETE FROM role_stats
      WHERE guild_id = ${guild.id}
        AND role_id = ${role.id}
    `);
  }

  async getTrackedRoles(guild) {
    const q = SQL`SELECT role_id, channel_id FROM role_stats WHERE guild_id = ${guild.id}`;
    const map = {};
    const res = (await this.query(q))[0];
    res.forEach(({ role_id: roleId, channel_id: channelId }) => {
      map[roleId] = channelId;
    });
    return map;
  }
}

module.exports = StatisticsQueries;
