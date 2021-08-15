'use strict';

const SQL = require('sql-template-strings');

/**
 * Database Mixin for dynamic voice queries
 * @mixin
 */
class DynamicVoiceQueries {
  async addTemplate(channel, relay) {
    const query = SQL`INSERT IGNORE INTO dynamic_voice_template VALUES
      (${channel.guild.id}, ${channel.id}, ${relay}, NULL);`;
    await this.query(query);
    return this.addInstance(channel, channel);
  }

  async deleteTemplate(channel) {
    const query = SQL`DELETE FROM dynamic_voice_template
      WHERE channel_id = ${channel.id};`;
    return this.query(query);
  }

  async addInstance(base, instance) {
    const query = SQL`INSERT INTO dynamic_voice_instance VALUES
      (${base.id}, ${instance.id});`;
    return this.query(query);
  }

  async deleteInstance(instance) {
    const query = SQL`DELETE FROM dynamic_voice_instance
      WHERE ${instance.id} = instance_id;`;
    return this.query(query);
  }

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

  async getDynTemplate(channelId) {
    const [rows] = await this.query(SQL`
      SELECT t.template
      FROM dynamic_voice_template as t
      WHERE t.channel_id = ${channelId}`);
    return rows[0].template;
  }

  async setDynTemplate(channelId, template) {
    return this.query(SQL`
      UPDATE dynamic_voice_template
      SET template = ${template}
      WHERE channel_id = ${channelId}`);
  }

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

  async isTemplate(channel) {
    const [rows] = await this.query(SQL`
      SELECT channel_id
      FROM dynamic_voice_template
      WHERE channel_id = ${channel.id}`);
    return rows.length;
  }

  async isInstance(channel) {
    const [rows] = await this.query(SQL`
      SELECT template_id, instance_id
      FROM dynamic_voice_instance
      WHERE instance_id = ${channel.id}`);
    return rows.length;
  }
}

module.exports = DynamicVoiceQueries;
