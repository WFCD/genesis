import SQL from 'sql-template-strings';
import Discord from 'discord.js';

const { Role } = Discord;

/**
 * Database Mixin for dynamic voice queries
 * @mixin
 * @mixes Database
 */
export default class PermissionsQueries {
  /**
   * Enables or disables a command for an individual member in a channel
   * @param {Discord.TextChannel} channel - A discord guild channel
   * @param {Discord.GuildMember} member - A discord guild member
   * @param {string|string[]} commandId - The ID of the command to set the permission for
   * @param {boolean} allowed - Whether this member should be allowed to use this command
   * @returns {Promise}
   */
  async setChannelPermissionForMember(channel, member, commandId, allowed) {
    // const query = SQL`INSERT INTO channel_permissions VALUES
    //   (${channel.id}, ${member.id}, TRUE, ${commandId}, ${allowed})
    //   ON DUPLICATE KEY UPDATE allowed = ${allowed};`;
    // return this.query(query);

    if (typeof commandId === 'string') {
      const query = SQL`INSERT INTO channel_permissions VALUES
        (${channel.id}, ${member.id}, TRUE, ${commandId}, ${allowed})
        ON DUPLICATE KEY UPDATE allowed = ${allowed};`;
      return this.query(query);
    }
    const query = SQL`INSERT INTO channel_permissions VALUES`;
    commandId.forEach((command, index) => {
      query
        .append(SQL`(${channel}, ${member}, TRUE, ${command}, ${allowed})`)
        .append(index !== commandId.length - 1 ? ',' : '');
    });
    query.append(SQL`ON DUPLICATE KEY UPDATE allowed = ${allowed}`);
    return this.query(query);
  }

  /**
   * Enables or disables a command for a role in a channel
   * @param {Discord.GuildChannel} channel - A discord guild channel
   * @param {Role} role - A discord role
   * @param {string|string[]} commandId - The ID of the command to set the permission for
   * @param {boolean} allowed - Whether this member should be allowed to use this command
   * @returns {Promise}
   */
  async setChannelPermissionForRole(channel, role, commandId, allowed) {
    if (typeof commandId === 'string') {
      const query = SQL`INSERT INTO channel_permissions VALUES
        (${channel.id}, ${role.id}, FALSE, ${commandId}, ${allowed})
        ON DUPLICATE KEY UPDATE allowed = ${allowed};`;
      return this.query(query);
    }
    const query = SQL`INSERT INTO channel_permissions VALUES`;
    commandId.forEach((command, index) => {
      query
        .append(SQL`(${channel}, ${role}, FALSE, ${command}, ${allowed})`)
        .append(index !== commandId.length - 1 ? ',' : '');
    });
    query.append(SQL`ON DUPLICATE KEY UPDATE allowed = ${allowed}`);
    return this.query(query);
  }

  /**
   * Enables or disables a command for an individual member in a guild
   * @param {Discord.Guild} guild - A discord guild
   * @param {Discord.GuildMember} member - A discord guild member
   * @param {string} commandId - The ID of the command to set the permission for
   * @param {boolean} allowed - Whether this member should be allowed to use this command
   * @returns {Promise}
   */
  async setGuildPermissionForMember(guild, member, commandId, allowed) {
    const query = SQL`INSERT INTO guild_permissions VALUES
      (${guild.id}, ${member.id}, TRUE, ${commandId}, ${allowed})
      ON DUPLICATE KEY UPDATE allowed = ${allowed};`;
    return this.query(query);
  }

  /**
   * Enables or disables a command for a role in a channel
   * @param {Discord.Guild} guild - A discord guild
   * @param {Discord.Role} role - A discord role
   * @param {string} commandId - The ID of the command to set the permission for
   * @param {boolean} allowed - Whether this member should be allowed to use this command
   * @returns {Promise}
   */
  async setGuildPermissionForRole(guild, role, commandId, allowed) {
    const query = SQL`INSERT INTO guild_permissions VALUES
      (${guild.id}, ${role.id}, FALSE, ${commandId}, ${allowed})
      ON DUPLICATE KEY UPDATE allowed = ${allowed};`;
    return this.query(query);
  }

  /**
   * Gets whether or not a user is allowed to use a particular command in a channel
   * @param {Discord.TextChannel} channel - A Discord channel
   * @param {string} memberId - String representing a user identifier
   * @param {string} commandId - String representing a command identifier
   * @returns {Promise}
   */
  async getChannelPermissionForMember(channel, memberId, commandId) {
    const query = SQL`SELECT allowed FROM channel_permissions
    WHERE channel_id = ${channel.id} AND command_id = ${commandId}
    AND is_user = true AND target_id = ${memberId}`;
    const res = await this.query(query);

    if (!res || res[0].length === 0) {
      return 'none';
    }
    return res[0][0].allowed;
  }

  /**
   * Gets whether or not a role is allowed to use a particular command in a channel
   * @param {Discord.TextChannel} channel A Discord channel
   * @param {string} role String representing a user identifier
   * @param {string} commandId String representing a command identifier
   * @returns {Promise}
   */
  async getChannelPermissionForRole(channel, role, commandId) {
    const query = SQL`SELECT allowed FROM channel_permissions
    WHERE channel_id = ${channel.id} AND command_id = ${commandId}
    AND is_user = false AND target_id = ${role.id}`;
    const [rows] = await this.query(query);

    if (!rows.length) {
      return 'none';
    }
    return rows[0].allowed;
  }

  /**
   * Gets whether or not a role in the user's
   * roles allows the user to use a particular command in a channel
   * @param {Discord.TextChannel} channel - A Discord channel
   * @param {User} user - A Discord user
   * @param {string} commandId - A command id for designating
   *                           a command to check permissions for
   * @returns {Promise}
   */
  async getChannelPermissionForUserRoles(channel, user, commandId) {
    const userRoles = channel.isText() && channel.guild ? user?.roles?.cache : {};
    const userRoleIds = Array.from(userRoles?.keys?.() || []);
    const query = SQL`SELECT target_id, is_user, allowed
        FROM channel_permissions
        WHERE channel_permissions.channel_id = ${channel.id}
          AND channel_permissions.target_id IN (${userRoleIds})
          AND command_id = ${commandId}
        UNION SELECT guild_permissions.target_id AS target_id,
             guild_permissions.is_user AS is_user,
             guild_permissions.allowed AS allowed
        FROM guild_permissions
        INNER JOIN channels USING (guild_id)
        LEFT JOIN channel_permissions ON
          channel_permissions.channel_id = channels.id
          AND guild_permissions.command_id = channel_permissions.command_id
          AND guild_permissions.target_id = channel_permissions.target_id
        WHERE channel_permissions.target_id IS NULL
          AND channels.id = ${channel.id}
          AND guild_permissions.target_id IN (${userRoleIds});`;
    const [rows] = await this.query(query);
    if (!rows.length) {
      return 'none';
    }

    rows.sort(
      (a, b) =>
        -Role.comparePositions(channel.guild.roles.cache.get(a.target_id), channel.guild.roles.cache.get(b.target_id))
    );

    return rows[0].allowed;
  }

  /**
   * Gets whether or not a user is allowed to use a particular command in a guild
   * @param {Discord.Guild} guild - A Discord guild
   * @param {string} memberId - String representing a user identifier
   * @param {string} commandId - String representing a command identifier
   * @returns {Promise}
   */
  async getGuildPermissionForMember(guild, memberId, commandId) {
    const query = SQL`SELECT allowed FROM guild_permissions
    WHERE channel_id = ${guild.id} AND command_id = ${commandId}
    AND is_user = true AND target_id = ${memberId}`;
    const [rows] = await this.query(query);
    if (!rows.length) {
      throw new Error(`The guild permissions for the guild ${guild.id}
         for member ${memberId} was not found in the database`);
    }
    return rows[0].allowed;
  }

  /**
   * Gets whether or not a role is allowed to use a particular command in a guild
   * @param {Discord.Guild} guild - A Discord guild
   * @param {string} role String representing a user identifier
   * @param {string} commandId String representing a command identifier
   * @returns {Promise}
   */
  async getGuildPermissionForRole(guild, role, commandId) {
    const query = SQL`SELECT allowed FROM guild_permissions
    WHERE channel_id = ${guild.id} AND command_id = ${commandId}
    AND is_user = false AND target_id = ${role.id}`;
    const [rows] = await this.query(query);
    if (!rows.length) {
      throw new Error(`The guild permissions for the guild ${guild.id}
         for member ${role.id} was not found in the database`);
    }
    return rows[0].allowed;
  }

  /**
   * Remove permissions corresponding to the guild id
   * @param  {Snowflake} guildId guild identifier for removal
   * @returns {Promise.<string>} status of removal
   */
  async removeGuildPermissions(guildId) {
    const query = SQL`DELETE FROM guild_permissions WHERE guild_id = ${guildId}`;
    return this.query(query);
  }

  /**
   * Remove permissions corresponding to the guild id
   * @param  {Snowflake} channelId channel identifier for removal
   * @returns {Promise.<string>} status of removal
   */
  async removeChannelPermissions(channelId) {
    const query = SQL`DELETE FROM channel_permissions WHERE channel_id = ${channelId}`;
    return this.query(query);
  }

  /**
   * Get a dump of allowed and denied permissions
   * @param  {Discord.Guild} guild guild to fetch settings for
   * @returns {Object}       Data about allowed data
   */
  async permissionsForGuild(guild) {
    const query = SQL`SELECT * FROM guild_permissions WHERE guild_id = ${guild.id}`;
    const [rows] = await this.query(query);
    if (rows) {
      return rows.map((value) => ({
        level: 'guild',
        command: value.command_id,
        isAllowed: value.allowed,
        type: value.is_user ? 'user' : 'role',
        appliesToId: value.target_id,
      }));
    }
    return [];
  }

  /**
   * Get a dump of allowed and denied permissions
   * @param  {Channel} channel channel to fetch settings for
   * @returns {Object}       Data about allowed data
   */
  async permissionsForChannel(channel) {
    const query = SQL`SELECT * FROM channel_permissions WHERE channel_id = ${channel.id}`;
    const [rows] = await this.query(query);
    if (rows) {
      return rows.map((value) => ({
        level: 'channel',
        command: value.command_id,
        isAllowed: value.allowed,
        type: value.is_user ? 'user' : 'role',
        appliesToId: value.target_id,
      }));
    }
    return [];
  }
}
