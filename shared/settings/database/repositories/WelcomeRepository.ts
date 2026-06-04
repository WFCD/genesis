import type { Guild, GuildBasedChannel } from 'discord.js';
import SQL from 'sql-template-strings';

import type { DatabaseDeps } from '../DatabaseDeps';

export interface WelcomeDeps extends DatabaseDeps {
  bot?: {
    client?: {
      channels: { cache: { get(id: string): GuildBasedChannel | undefined } };
    };
  };
}

type GuildRef = Guild | { id: string };
type MessageRef = {
  guild: { id: string };
  channel: { id: string };
};

export type WelcomeEntry = {
  isDm: boolean;
  message: string;
  channel: GuildBasedChannel | undefined;
};

/**
 * Welcome message templates + destination channels per guild.
 * Mirrors welcome mixin methods.
 */
export default class WelcomeRepository {
  constructor(private readonly deps: WelcomeDeps) {}

  async clearWelcomeForGuild(guild: GuildRef, isDm: boolean) {
    const query = SQL`DELETE FROM welcome_messages WHERE guild_id=${guild.id} && is_dm=${isDm}`;
    return this.deps.query(query);
  }

  async setWelcome(message: MessageRef, isDm: boolean, text: string) {
    const query = SQL`INSERT INTO welcome_messages (guild_id, is_dm, channel_id, message) VALUES (${message.guild.id}, ${isDm}, ${message.channel.id}, ${text})
      ON DUPLICATE KEY UPDATE message = ${text};`;
    return this.deps.query(query);
  }

  async getWelcomes(guild?: GuildRef | null): Promise<WelcomeEntry[]> {
    if (!guild) {
      return [];
    }

    const query = SQL`SELECT * FROM welcome_messages WHERE guild_id=${guild.id}`;
    const [rows] = (await this.deps.query(query)) ?? [[]];
    return (rows as Array<{ is_dm: boolean; message: string; channel_id: string }>).map((value) => ({
      isDm: value.is_dm,
      message: value.message,
      channel: this.deps.bot?.client?.channels.cache.get(value.channel_id),
    }));
  }
}
