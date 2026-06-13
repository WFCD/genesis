import { ChannelType, GuildVerificationLevel } from 'discord.js';

import BaseEmbed from './BaseEmbed';

const verifications: Record<GuildVerificationLevel, { color: number; msg: string }> = {
  [GuildVerificationLevel.None]: {
    color: 0x747f8d,
    msg: 'None',
  },
  [GuildVerificationLevel.Low]: {
    color: 0x43b581,
    msg: '**Low**\n_Must have a verified email on their Discord Account_',
  },
  [GuildVerificationLevel.Medium]: {
    color: 0xfaa61a,
    msg: '**Medium**\n_Must also be registered on Discord for longer than 5 minutes_',
  },
  [GuildVerificationLevel.High]: {
    color: 0xf57731,
    msg: '**(╯°□°）╯︵ ┻━┻**\n_Must also be a member of this server for longer than 10 minutes._',
  },
  [GuildVerificationLevel.VeryHigh]: {
    color: 0xf04747,
    msg: '**Insane: ┻━┻ ﾐヽ(ಠ益ಠ)ノ彡┻━┻**\n_Must have a verified phone on their Discord Account._',
  },
};

/**
 * Generates daily deal embeds
 */
export default class ServerInfoEmbed extends BaseEmbed {
  /**
   * @param {Guild} guild - The sales to be displayed as featured or popular
   */
  constructor(guild) {
    super();

    const verification = verifications[guild.verificationLevel] ?? verifications[GuildVerificationLevel.None];

    this.title = guild.name;
    this.color = verification.color;
    if (guild.icon) {
      this.thumbnail = { url: guild.iconURL({ size: 128 }) ?? undefined };
    }
    this.fields = [
      {
        name: 'Created:',
        value: guild.createdAt.toLocaleString(),
        inline: true,
      },
      {
        name: 'Owner:',
        value: `<@${guild.ownerId}>`,
        inline: true,
      },
      {
        name: 'Text Channels:',
        value: `Count: ${guild.channels.cache.filter((channel) => channel.type === ChannelType.GuildText).size || 0}`,
        inline: true,
      },
      {
        name: 'Voice Channels:',
        value: `Count: ${guild.channels.cache.filter((channel) => channel.type === ChannelType.GuildVoice).size || 0}`,
        inline: true,
      },
      {
        name: 'Members:',
        value: `Count: ${guild.memberCount}`,
        inline: true,
      },
      {
        name: 'Emojis:',
        value: `Count: ${guild.emojis.cache.size}`,
        inline: true,
      },
      {
        name: 'Verification Level:',
        value: verification.msg,
        inline: true,
      },
      {
        name: 'Roles:',
        value: `Count: ${guild.roles.cache.size}`,
        inline: true,
      },
    ];
    this.footer = { text: `Server ID: ${guild.id}` };
  }
}
