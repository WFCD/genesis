'use strict';

const SQL = require('sql-template-strings');
const JoinableRole = require('../../models/JoinableRole');

class PrivateRoomQueries {
  constructor(db) {
    this.db = db;
  }

  async removePrivateChannels(guild) {
    const query = SQL`DELETE FROM private_channels WHERE guild_id=${guild.id}`;
    return this.db.query(query);
  }

  /**
   * Set the joinable roles for a guild
   * @param {Guild} guild Guild to set joinable roles for
   * @param {Array.<string>} roles Array of role ids to set
   * @returns {Promise}
   */
  async setRolesForGuild(guild, roles) {
    const query = SQL`INSERT INTO guild_joinable_roles VALUES
      (${guild.id}, JSON_ARRAY(${roles}))
      ON DUPLICATE KEY UPDATE id_list = JSON_ARRAY(${roles});`;
    return this.db.query(query);
  }

  /**
   * Get the roles that can be joined for a guild
   * @param  {Guild} guild [description]
   * @returns {Promise.<Array.<Role>>} Promise of array of roles that are joinable
   */
  async getRolesForGuild(guild) {
    const query = SQL`SELECT id_list
      FROM guild_joinable_roles
      WHERE guild_id=${guild.id}`;
    const res = await this.db.query(query);
    if (res[0][0]) {
      const validList = res[0][0].id_list
        .filter((role) => {
          if (!role) {
            return undefined;
          }
          const parsed = JSON.parse(role);
          if (typeof parsed === 'object') {
            return typeof guild.roles.has(parsed.id);
          }
          if (typeof parsed === 'number') {
            return guild.roles.has(String(parsed));
          }
          return undefined;
        })
        .filter(role => role)
        .map((role) => {
          const parsed = JSON.parse(role);
          if (typeof parsed === 'object' && guild.roles.has(parsed.id)) {
            const joinable = new JoinableRole(guild.roles.get(parsed.id));
            if (typeof parsed.requiredRole !== 'undefined') {
              joinable.requiredRole = guild.roles.has(parsed.requiredRole)
                ? guild.roles.get(parsed.requiredRole)
                : undefined;
            }
            joinable.isLeaveable = typeof parsed.leaveable !== 'undefined' ? parsed.leavable : true;
            return joinable;
          }
          if (typeof parsed === 'string' && guild.roles.has(parsed)) {
            const joinable = new JoinableRole(guild.roles.get(parsed));
            joinable.requiredRole = undefined;
            joinable.isLeaveable = true;
            return joinable;
          }
          return undefined;
        })
        .filter(role => role);
      return validList;
    }
    return [];
  }

  async addPrivateRoom(guild, textChannel, voiceChannel, category, member) {
    let query;
    if (textChannel) {
      query = SQL`INSERT INTO private_channels (guild_id, text_id, voice_id, category_id, created_by) VALUES (${guild.id}, ${textChannel.id}, ${voiceChannel.id}, ${category.id}, ${member.id})`;
    } else {
      query = SQL`INSERT INTO private_channels (guild_id, text_id, voice_id, category_id, created_by) VALUES (${guild.id}, 0, ${voiceChannel.id}, ${category.id}, ${member.id})`;
    }
    return this.db.query(query);
  }

  async deletePrivateRoom(room) {
    const {
      guild, voiceChannel, voiceId,
    } = room;
    const query = SQL`DELETE FROM private_channels WHERE guild_id = ${guild.id} AND voice_id = ${voiceChannel ? voiceChannel.id : voiceId}`;
    return this.db.query(query);
  }

  async userHasRoom(member) {
    const query = SQL`SELECT * FROM private_channels WHERE guild_id = ${member.guild.id} and created_by = ${member.id}`;
    const res = await this.db.query(query);
    return res[0].length > 0;
  }

  async getUsersRoom(member) {
    const query = SQL`SELECT guild_id, text_id, voice_id, category_id, created_at as crt_sec  FROM private_channels WHERE guild_id = ${member.guild.id} and created_by = ${member.id}`;
    const res = await this.db.query(query);
    if (res[0]) {
      return {
        guild: this.bot.client.guilds.get(res[0][0].guild_id),
        textChannel: res[0][0].text_id
          ? this.bot.client.channels.get(res[0][0].text_id) : undefined,
        voiceChannel: this.bot.client.channels.get(res[0][0].voice_id),
        category: this.bot.client.channels.get(res[0][0].category_id),
        createdAt: res[0][0].crt_sec,
        guildId: res[0][0].guild_id,
        textId: res[0][0].text_id || undefined,
        voiceId: res[0][0].voice_id,
        categoryId: res[0][0].category_id,
      };
    }
    return undefined;
  }

  async getPrivateRooms() {
    const query = SQL`SELECT guild_id, text_id, voice_id, category_id, created_at as crt_sec  FROM private_channels WHERE MOD(IFNULL(guild_id, 0) >> 22, ${this.bot.shardCount}) = ${this.bot.shardId}`;
    const res = await this.db.query(query);
    if (res[0]) {
      return res[0].map(value => ({
        guild: this.bot.client.guilds.get(value.guild_id),
        textChannel: value.text_id ? this.bot.client.channels.get(value.text_id) : undefined,
        voiceChannel: this.bot.client.channels.get(value.voice_id),
        category: this.bot.client.channels.get(value.category_id),
        createdAt: value.crt_sec,
        guildId: value.guild_id,
        textId: value.text_id || undefined,
        voiceId: value.voice_id,
        categoryId: value.category_id,
      }));
    }
    return [];
  }
}

module.exports = PrivateRoomQueries;
