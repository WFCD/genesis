'use strict';

const BaseEmbed = require('./BaseEmbed.js');

const verificationLevels = ['None', 'Low\nMust have a verified email on their Discord Account', 'Medium\nMust also be registered on Discord for longer than 5 minutes', '(╯°□°）╯︵ ┻━┻\nMust also be a member of this server for longer than 10 minutes.', 'Insane: ┻━┻ ﾐヽ(ಠ益ಠ)ノ彡┻━┻\nMust have a verified phone on their Discord Account.'];
const verificationColors = [0x747f8d, 0x43b581, 0xfaa61a, 0xf57731, 0xf04747];
/**
 * Generates daily deal embeds
 */
class ServerInfoEmbed extends BaseEmbed {
  /**
   * @param {Genesis} bot - An instance of Genesis
   * @param {Guild} guild - The sales to be displayed as featured or popular
   */
  constructor(bot, guild) {
    super();

    this.title = guild.name;
    this.description = `**Region:** ${guild.region}`;
    this.color = verificationColors[guild.verificationLevel];
    this.thumbnail = { url: `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`};
    this.fields = [
      {
        name: 'Created:',
        value: guild.createdAt.toLocaleString(),
        inline: true,
      },
      {
        name: 'Owner:',
        value: `${guild.owner.displayName} (${guild.owner})`,
        inline: true,
      },
      {
        name: 'Text Channels:',
        value: guild.channels.filter(channel => channel.type === 'text').size || 0,
        inline: true,
      },
      {
        name: 'Voice Channels:',
        value: guild.channels.filter(channel => channel.type === 'voice').size || 0,
        inline: true,
      },
      {
        name: 'Members:',
        value: `${guild.members.filter(member => member.presence.status === 'online' || member.presence.status === 'idle' || member.presence.status === 'dnd').size}/${guild.memberCount}` || 0,
        inline: true,
      },
      {
        name: 'Emojis:',
        value: `Count: ${guild.emojis.array().length}`,
        inline: true,
      },
      {
        name: 'Verification Level:',
        value: verificationLevels[guild.verificationLevel],
        inline: true,
      },
      {
        name: 'Roles:',
        value: `Count: ${guild.roles.array().length}`,
        inline: true,
      },
    ];
    this.footer = { text: `Server ID: ${guild.id}` };
  }
}

module.exports = ServerInfoEmbed;
