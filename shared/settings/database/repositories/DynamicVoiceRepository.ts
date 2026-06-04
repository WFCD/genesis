import type { Guild, VoiceBasedChannel, VoiceChannel } from 'discord.js';
import SQL from 'sql-template-strings';

import type { DatabaseDeps } from '../DatabaseDeps';

type TemplateChannel = VoiceChannel & { guild: Guild };

/**
 * Dynamic voice channel templates and spawned instances.
 * Mirrors the `templates` slash command + DynamicVoiceHandler domain.
 */
export default class DynamicVoiceRepository {
  constructor(private readonly deps: DatabaseDeps) {}

  async addTemplate(channel: TemplateChannel, relay: boolean) {
    const query = SQL`INSERT IGNORE INTO dynamic_voice_template VALUES
      (${channel.guild.id}, ${channel.id}, ${relay}, NULL);`;
    await this.deps.query(query);
    return this.addInstance(channel, channel);
  }

  async deleteTemplate(channel: { id: string }) {
    const query = SQL`DELETE FROM dynamic_voice_template
      WHERE channel_id = ${channel.id};`;
    return this.deps.query(query);
  }

  async addInstance(base: { id: string }, instance: { id: string }) {
    const query = SQL`INSERT INTO dynamic_voice_instance VALUES
      (${base.id}, ${instance.id});`;
    return this.deps.query(query);
  }

  async deleteInstance(instance: { id: string }) {
    const query = SQL`DELETE FROM dynamic_voice_instance
      WHERE ${instance.id} = instance_id;`;
    return this.deps.query(query);
  }

  async getInstances(template: VoiceBasedChannel & { guild: Guild }) {
    const query = SQL`SELECT instance_id
      FROM dynamic_voice_instance
      WHERE template_id = ${template.id};`;

    const [rows] = (await this.deps.query(query)) ?? [[]];
    if (!rows.length) {
      return { instances: [], remainingEmpty: 1 };
    }

    const instances: VoiceBasedChannel[] = [];
    const empties: VoiceBasedChannel[] = [];
    let remainingEmpty = 0;
    (rows as Array<{ instance_id: string }>)
      .map((row) => row.instance_id)
      .forEach((channelId) => {
        if (template.guild.channels.cache.has(channelId)) {
          const channel = template.guild.channels.cache.get(channelId) as VoiceBasedChannel;
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

  async getTemplates(guilds: Guild[]) {
    const gids = guilds.map((guild) => guild.id);

    const query = SQL`SELECT channel_id
      FROM dynamic_voice_template
      WHERE guild_id in (${gids});`;

    const [rows] = (await this.deps.query(query)) ?? [[]];
    if (!rows.length) {
      return [];
    }
    return (rows as Array<{ channel_id: string }>).map((row) => row.channel_id);
  }

  async getDynTemplate(channelId: string) {
    const [rows] = (await this.deps.query(SQL`
      SELECT t.template
      FROM dynamic_voice_template as t
      WHERE t.channel_id = ${channelId}`)) ?? [[]];
    return rows[0]?.template;
  }

  async setDynTemplate(channelId: string, template: string | undefined) {
    return this.deps.query(SQL`
      UPDATE dynamic_voice_template
      SET template = ${template}
      WHERE channel_id = ${channelId}`);
  }

  async isRelay(channelId: string) {
    const [rows] = (await this.deps.query(SQL`
      SELECT t.is_relay
      FROM dynamic_voice_template as t,
        dynamic_voice_instance as i
      WHERE t.channel_id = ${channelId}
        OR (t.channel_id = i.template_id
          AND i.instance_id = ${channelId})`)) ?? [[]];
    if (!rows.length) {
      return 'none';
    }
    return rows[0].is_relay === '1';
  }

  async isTemplate(channel: { id: string }) {
    const [rows] = (await this.deps.query(SQL`
      SELECT channel_id
      FROM dynamic_voice_template
      WHERE channel_id = ${channel.id}`)) ?? [[]];
    return rows.length;
  }

  async isInstance(channel: { id: string }) {
    const [rows] = (await this.deps.query(SQL`
      SELECT template_id, instance_id
      FROM dynamic_voice_instance
      WHERE instance_id = ${channel.id}`)) ?? [[]];
    return rows.length;
  }
}
