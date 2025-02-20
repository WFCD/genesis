import BaseEmbed from './BaseEmbed.js';

const verifications = {
  NONE: {
    color: 0x747f8d,
    msg: 'None',
  },
  LOW: {
    color: 0x43b581,
    msg: '**Low**\n_Must have a verified email on their Discord Account_',
  },
  MEDIUM: {
    color: 0xfaa61a,
    msg: '**Medium**\n_Must also be registered on Discord for longer than 5 minutes_',
  },
  HIGH: {
    color: 0xf57731,
    msg: '**(╯°□°）╯︵ ┻━┻**\n_Must also be a member of this server for longer than 10 minutes._',
  },
  VERY_HIGH: {
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

    this.setTitle(guild.name);
    this.setColor(verifications[guild.verificationLevel].color);
    this.setThumbnail(`https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`);
    this.setFields([
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
        value: `Count: ${guild.channels.cache.filter((channel) => channel.type === 'GUILD_TEXT').size || 0}`,
        inline: true,
      },
      {
        name: 'Voice Channels:',
        value: `Count: ${guild.channels.cache.filter((channel) => channel.type === 'GUILD_VOICE').size || 0}`,
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
        value: verifications[guild.verificationLevel].msg,
        inline: true,
      },
      {
        name: 'Roles:',
        value: `Count: ${guild.roles.cache.size}`,
        inline: true,
      },
    ]);
    this.setFooter({ text: `Server ID: ${guild.id}` });
  }
}
