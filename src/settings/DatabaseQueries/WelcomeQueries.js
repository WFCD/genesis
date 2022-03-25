import SQL from 'sql-template-strings';

/**
 * Database Mixin for Welcome queries
 * @mixin
 * @mixes Database
 */
export default class WelcomeQueries {
  /**
   * Clear welcome messages for a guild
   * @param {Guild} guild The guild
   * @param {boolean} isDm whether or not the message to be cleared is the dm or in-chat message
   * @returns {Promise}
   */
  async clearWelcomeForGuild(guild, isDm) {
    const query = SQL`DELETE FROM welcome_messages WHERE guild_id=${guild.id} && is_dm=${isDm}`;
    return this.query(query);
  }

  /**
   * Sets a ping message for an item or event type in a guild
   * @param {Discord.Message} message Message to derive information for guild and channel
   * @param {boolean} isDm whether or not this is for the dm welcome
   * @param {string} text The text of the ping message
   * @returns {Promise}
   */
  async setWelcome(message, isDm, text) {
    const query = SQL`INSERT INTO welcome_messages (guild_id, is_dm, channel_id, message) VALUES (${message.guild.id}, ${isDm}, ${message.channel.id}, ${text})
      ON DUPLICATE KEY UPDATE message = ${text};`;
    return this.query(query);
  }

  /**
   * Get welcomes for a guild
   * @param {Discord.Guild} guild guild to fetch welcomes for
   * @returns {Promise<*[]|*>}
   */
  async getWelcomes(guild) {
    if (guild) {
      const query = SQL`SELECT * FROM welcome_messages WHERE guild_id=${guild.id}`;
      const [rows] = await this.query(query);
      if (rows) {
        return rows.map(value => ({
          isDm: value.is_dm,
          message: value.message,
          channel: this.bot.client.channels.cache.get(value.channel_id),
        }));
      }
      return [];
    }
    return [];
  }
}
