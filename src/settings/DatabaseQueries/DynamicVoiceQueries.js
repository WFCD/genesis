'use strict';

const SQL = require('sql-template-strings');

class DynamicVoiceQueries {
  constructor(db) {
    this.db = db;
  }

  async addTemplate(channel, relay) {
    const query = SQL`INSERT IGNORE INTO dynamic_voice_template VALUES
      (${channel.guild.id}, ${channel.id}, ${relay});`;
    await this.db.query(query);
    return this.addInstance(channel, channel);
  }

  async deleteTemplate(channel) {
    const query = SQL`DELETE FROM dynamic_voice_template
      WHERE channel_id = ${channel.id};`;
    return this.db.query(query);
  }

  async addInstance(base, instance) {
    const query = SQL`INSERT INTO dynamic_voice_instance VALUES
      (${base.id}, ${instance.id});`;
    return this.db.query(query);
  }

  async deleteInstance(instance) {
    const query = SQL`DELETE FROM dynamic_voice_instance
      WHERE ${instance.id} = instance_id;`;
    return this.db.query(query);
  }

  async getInstances(template) {
    const query = SQL`SELECT instance_id
      FROM dynamic_voice_instance
      WHERE template_id = ${template.id};`;

    const res = await this.db.query(query);
    if (res[0].length === 0) {
      return [];
    }

    const instances = [];
    const empties = [];
    let remainingEmpty = 0;
    res[0]
      .map(instance => instance.instance_id)
      .forEach((channelId) => {
        if (template.guild.channels.has(channelId)) {
          const channel = template.guild.channels.get(channelId);
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

    const res = await this.db.query(query);
    if (res[0].length === 0) {
      return [];
    }
    return res[0].map(result => result.channel_id);
  }

  async isRelay(channelId) {
    const res = await this.db.query(
      SQL`SELECT t.is_relay
      FROM dynamic_voice_template as t,
        dynamic_voice_instance as i
      WHERE t.channel_id = ${channelId}
        OR (t.channel_id = i.template_id
          AND i.instance_id = ${channelId})`,
    );
    if (!res[0].length) {
      return 'none';
    }
    return res[0][0].is_relay === '1';
  }

  async isInstance(channel) {
    const res = await this.db.query(SQL`
      SELECT template_id, instance_id
      FROM dynamic_voice_instance
      WHERE instance_id = ${channel.id}`);
    return res[0].length;
  }
}

module.exports = DynamicVoiceQueries;
