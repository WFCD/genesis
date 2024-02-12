import SQL from 'sql-template-strings';

import JoinableRole from '../../models/JoinableRole.js';

/**
 * Database Mixin for private room queries
 * @mixin
 * @mixes Database
 */
export default class PrivateRoomQueries {
  async removePrivateChannels(guild) {
    const query = SQL`DELETE FROM private_channels WHERE guild_id=${guild.id}`;
    return this.query(query);
  }

  /**
   * Room params
   * @typedef {Object} Room
   * @property {Discord.Guild} guild guild containing room
   * @property {Discord.VoiceChannel} voiceChannel corresponding voice channel
   * @property {Discord.TextChannel} textChannel corresponding text channel
   * @property {Discord.CategoryChannel} category Category containing other channels
   * @property {Discord.Snowflake} voiceId identifier for voice channel
   * @property {Discord.Snowflake} guildId identifier for guild
   * @property {Discord.Snowflake} textId identifier for text channel
   * @property {Discord.Snowflake} categoryId identifier for category
   * @property {string} createdAt timestamp string
   */

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
    return this.query(query);
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
    const [rows] = await this.query(query);
    if (rows.length) {
      const rawList = typeof rows[0].id_list === 'string' ? JSON.parse(rows[0].id_list) : rows[0].id_list;
      return rawList
        .filter((role) => {
          if (!role) {
            return undefined;
          }
          const parsed = JSON.parse(role);
          if (typeof parsed === 'object') {
            return typeof guild.roles.cache.has(parsed.id);
          }
          if (typeof parsed === 'number') {
            return guild.roles.cache.has(String(parsed));
          }
          return undefined;
        })
        .filter((role) => role)
        .map((role) => {
          const parsed = JSON.parse(role);
          if (typeof parsed === 'object' && guild.roles.cache.has(parsed.id)) {
            const joinable = new JoinableRole(guild.roles.cache.get(parsed.id));
            if (typeof parsed.requiredRole !== 'undefined') {
              joinable.requiredRole = guild.roles.cache.has(parsed.requiredRole)
                ? guild.roles.cache.get(parsed.requiredRole)
                : undefined;
            }
            joinable.isLeaveable = typeof parsed.leaveable !== 'undefined' ? parsed.leavable : true;
            return joinable;
          }
          if (typeof parsed === 'string' && guild.roles.cache.has(parsed)) {
            const joinable = new JoinableRole(guild.roles.cache.get(parsed));
            joinable.requiredRole = undefined;
            joinable.isLeaveable = true;
            return joinable;
          }
          return undefined;
        })
        .filter((role) => role);
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
    return this.query(query);
  }

  /**
   * Delete a given room
   * @param {Room} room room to delete
   * @returns {Promise<mysql.Connection.query>}
   */
  async deletePrivateRoom(room) {
    const { guild, voiceChannel, voiceId } = room;
    const query = SQL`DELETE FROM private_channels WHERE guild_id = ${guild.id} AND voice_id = ${
      voiceChannel ? voiceChannel.id : voiceId
    }`;
    return this.query(query);
  }

  async userHasRoom(member) {
    const query = SQL`SELECT *
      FROM private_channels
      WHERE guild_id = ${member.guild.id}
        and created_by = ${member.id}`;
    const [rows] = await this.query(query);
    return rows.length;
  }

  /**
   * Get the existing room for a user
   * @param {Discord.GuildMember} member user to lookup room for
   * @returns {Promise<Room>}
   */
  async getUsersRoom(member) {
    const query = SQL`SELECT guild_id, text_id, voice_id, category_id, created_at as crt_sec  FROM private_channels WHERE guild_id = ${member.guild.id} and created_by = ${member.id}`;
    const [rows] = await this.query(query);
    if (rows?.length) {
      /**
       * @type {Room}
       */
      return {
        guild: this.bot.client.guilds.cache.get(rows[0].guild_id),
        textChannel: rows[0].text_id ? this.bot.client.channels.cache.get(rows[0].text_id) : undefined,
        voiceChannel: this.bot.client.channels.cache.get(rows[0].voice_id),
        category: this.bot.client.channels.cache.get(rows[0].category_id),
        createdAt: rows[0].crt_sec,
        guildId: rows[0].guild_id,
        textId: rows[0].text_id || undefined,
        voiceId: rows[0].voice_id,
        categoryId: rows[0].category_id,
      };
    }
    return undefined;
  }

  /**
   * Check if room is a private room
   * @param {Discord.VoiceChannel} channel channel that could be private
   * @returns {Promise<*>}
   */
  async isPrivateRoom(channel) {
    const query = SQL`
      SELECT *
      FROM private_channels
      WHERE guild_id = ${channel.guild.id}
        AND voice_id = ${channel.id}`;
    const [rows] = await this.query(query);
    return rows?.length;
  }

  /**
   * Get all private rooms on a shard
   * @param {Array<number>} shards array to check against pulling rooms
   * @returns {Promise<Array<Room>>}
   */
  async getPrivateRooms(shards) {
    const query = SQL`
      SELECT guild_id, text_id, voice_id, category_id, created_at as crt_sec
      FROM private_channels
      WHERE MOD(IFNULL(guild_id, 0) >> 22, ${this.bot.shardCount}) in (${shards})`;
    const [rows] = await this.query(query);
    if (rows) {
      return rows.map((value) => ({
        guild: this.bot.client.guilds.cache.get(value.guild_id),
        textChannel: value.text_id ? this.bot.client.channels.cache.get(value.text_id) : undefined,
        voiceChannel: this.bot.client.channels.cache.get(value.voice_id),
        category: this.bot.client.channels.cache.get(value.category_id),
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
