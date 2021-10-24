'use strict';

const SQL = require('sql-template-strings');

// eslint-disable-next-line no-unused-vars
const Discord = require('discord.js');
// eslint-disable-next-line no-unused-vars
const mysql = require('mysql2/promise');
// eslint-disable-next-line no-unused-vars
const Database = require('../Database');

/**
 * Database Mixin for dynamic voice queries
 * @mixin
 * @mixes Database
 */
module.exports = class DynamicVoiceQueries {
  /**
   * Add a channel as a template
   * @param {Discord.VoiceChannel} channel channel to be added as a template
   * @param {boolean} relay whether or not to add this as a relay template channel
   * @returns {Promise<*>}
   */
  async addTemplate(channel, relay) {
    const query = SQL`INSERT IGNORE INTO dynamic_voice_template VALUES
      (${channel.guild.id}, ${channel.id}, ${relay}, NULL);`;
    await this.query(query);
    return this.addInstance(channel, channel);
  }

  /**
   * Delete a template from the template channels
   * @param {Discord.VoiceChannel} channel channel to be removed
   * @returns {Promise<mysql.Connection.query>}
   */
  async deleteTemplate(channel) {
    const query = SQL`DELETE FROM dynamic_voice_template
      WHERE channel_id = ${channel.id};`;
    return this.query(query);
  }

  /**
   * Add an instance to a template's instances
   * @param {Discord.VoiceChannel} base base channel
   * @param {Discord.VoiceChannel} instance instance of the channel
   * @returns {Promise<mysql.Connection.query>}
   */
  async addInstance(base, instance) {
    const query = SQL`INSERT INTO dynamic_voice_instance VALUES
      (${base.id}, ${instance.id});`;
    return this.query(query);
  }

  /**
   * Remove an instance of a template
   * @param {Discord.VoiceChannel} instance to be removed
   * @returns {Promise<mysql.Connection.query>}
   */
  async deleteInstance(instance) {
    const query = SQL`DELETE FROM dynamic_voice_instance
      WHERE ${instance.id} = instance_id;`;
    return this.query(query);
  }

  /**
   * Get a template's instances
   * @param {Discord.VoiceChannel} template template to fetch instances of
   * @returns {Promise<{remainingEmpty: number, instances: *[]}>}
   */
  async getInstances(template) {
    const query = SQL`SELECT instance_id
      FROM dynamic_voice_instance
      WHERE template_id = ${template.id};`;

    const [rows] = await this.query(query);
    if (!rows.length) {
      return { instances: [], remainingEmpty: 1 };
    }

    const instances = [];
    const empties = [];
    let remainingEmpty = 0;
    rows
      .map(row => row.instance_id)
      .forEach((channelId) => {
        if (template.guild.channels.cache.has(channelId)) {
          const channel = template.guild.channels.cache.get(channelId);
          if (channel.members.size) {
            instances.push(channel);
          } else {
            empties.push(channel);
          }
        } else {
          this.deleteInstance({ id: channelId });
        }
      });

    empties.sort((a, b) => {
      const aIsTemplate = a.id === template.id;
      const bIsTemplate = b.id === template.id;
      if ((aIsTemplate && bIsTemplate) || (!aIsTemplate && !bIsTemplate)) {
        return 0;
      }
      if (aIsTemplate && !bIsTemplate) {
        return -1;
      }
      if (!aIsTemplate && bIsTemplate) {
        return 1;
      }
      return 0;
    });

    empties.forEach((emptyChannel, index) => {
      if (index !== 0 && emptyChannel.id !== template.id) {
        this.deleteInstance(emptyChannel);
        if (emptyChannel.deletable) {
          emptyChannel.delete('Removing dynamic channel');
        }
      } else {
        instances.push(emptyChannel);
        remainingEmpty += 1;
      }
    });
    return { instances, remainingEmpty };
  }

  /**
   * Guilds to get templates for
   * @param {Array<Discord.Guild>} guilds array of guilds to fetch templates for
   * @returns {Promise<*[]|*>}
   */
  async getTemplates(guilds) {
    const gids = guilds.map(guild => guild.id);

    const query = SQL`SELECT channel_id
      FROM dynamic_voice_template
      WHERE guild_id in (${gids});`;

    const [rows] = await this.query(query);
    if (!rows.length) {
      return [];
    }
    return rows.map(row => row.channel_id);
  }

  /**
   * Discord channel id to get dynamic voice template for
   * @param {Discord.Snowflake} channelId to get template for
   * @returns {Promise<*>}
   */
  async getDynTemplate(channelId) {
    const [rows] = await this.query(SQL`
      SELECT t.template
      FROM dynamic_voice_template as t
      WHERE t.channel_id = ${channelId}`);
    return rows[0].template;
  }

  /**
   * Set the dynamic channel template string
   * @param {Discord.Snowflake} channelId to set template for
   * @param {string} template template pattern/string
   * @returns {Promise<mysql.Connection.query>}
   */
  async setDynTemplate(channelId, template) {
    return this.query(SQL`
      UPDATE dynamic_voice_template
      SET template = ${template}
      WHERE channel_id = ${channelId}`);
  }

  /**
   * Get whether or not the channel is a relay
   * @param {Discord.Snowflake} channelId to check
   * @returns {Promise<string|boolean>}
   */
  async isRelay(channelId) {
    const [rows] = await this.query(SQL`
      SELECT t.is_relay
      FROM dynamic_voice_template as t,
        dynamic_voice_instance as i
      WHERE t.channel_id = ${channelId}
        OR (t.channel_id = i.template_id
          AND i.instance_id = ${channelId})`);
    if (!rows.length) {
      return 'none';
    }
    return rows[0].is_relay === '1';
  }

  /**
   * Get whether or not the channel is a template
   * @param {Discord.Channel} channel to check
   * @returns {Promise<string|boolean>}
   */
  async isTemplate(channel) {
    const [rows] = await this.query(SQL`
      SELECT channel_id
      FROM dynamic_voice_template
      WHERE channel_id = ${channel.id}`);
    return rows.length;
  }

  /**
   * Get whether or not the channel is a template instance
   * @param {Discord.Channel} channel to check
   * @returns {Promise<string|boolean>}
   */
  async isInstance(channel) {
    const [rows] = await this.query(SQL`
      SELECT template_id, instance_id
      FROM dynamic_voice_instance
      WHERE instance_id = ${channel.id}`);
    return rows.length;
  }
};
