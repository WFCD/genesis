'use strict';

const BaseEmbed = require('./BaseEmbed.js');

const negate = '✘';
const affirm = '✓';

/**
 * Generates daily deal thiss
 */
class UserInfoEmbed extends BaseEmbed {
  constructor(bot, guilds, user, member, message) {
    super();

    // const guildString = guilds.filter(guild
    // => guild.members.cache.get(user.id)).map(guild => guild.name).join('; ');
    this.author = {
      name: `${user.username}#${user.discriminator}`,
      icon_url: user.displayAvatarURL().replace('.webp', '.png').replace('.webm', '.gif'),
    };
    this.thumbnail = {
      url: user.displayAvatarURL().replace('.webp', '.png').replace('.webm', '.gif'),
    };
    this.fields = [
      {
        name: 'Profile',
        value: user.toString(),
        inline: true,
      },
      {
        name: 'Registered',
        value: user?.createdAt?.toLocaleString() || 'N/A',
        inline: true,
      },
    ];
    this.footer = {
      icon_url: user.defaultAvatarURL,
      text: user.id,
    };

    if (member) {
      this.description = member?.presence?.activities?.[0]
        ? (member?.presence?.activities?.[0].state || member?.presence?.activities?.[0].name)
        : 'No Game';

      this.fields = this.fields.concat([
        {
          name: 'Owns the server?',
          value: member.id === message.guild.ownerID ? affirm : negate,
          inline: true,
        },
        member?.presence?.status ? {
          name: 'Status',
          value: member.presence.status,
          inline: true,
        } : undefined,
        {
          name: 'Current State:',
          value: `**Deafened:** ${member.deaf ? affirm : negate}\n`
                  + `**Kickable:** ${member.kickable ? affirm : negate}\n`
                  + `**Muted:** ${member.mute ? affirm : negate}\n`
                  + `**Speaking:** ${member.speaking ? affirm : negate}\n`
                  + `**Guild Muted:** ${member.serverMute ? affirm : negate}\n`
                  + `**Guild Deafened:** ${member.serverDeaf ? affirm : negate}`,
          inline: false,
        },
        {
          name: 'Roles:',
          value: member.roles.cache.size ? member.roles.cache.map(role => role).join(', ') : 'User has no roles.',
          inline: false,
        },
      ].filter(a => a));

      this.footer.text = `${this.footer.text} - Joined`;
      this.timestamp = member.joinedAt;
    }
  }
}

module.exports = UserInfoEmbed;
