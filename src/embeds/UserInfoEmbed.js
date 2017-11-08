'use strict';

const BaseEmbed = require('./BaseEmbed.js');

/**
 * Generates daily deal thiss
 */
class UserInfoEmbed extends BaseEmbed {
  /**
   * @param {Genesis} bot - An instance of Genesis
   * @param {Array<Guild>} guilds - The guilds this bot shares on this shard with a user
   * @param {User} user - The targeted user of the command
   * @param {GuildMemeber} member - The guild member object for thetargeted user,
   *                              if called in a guild.
   * @param {Message} message - Message this derives information from.
   */
  constructor(bot, guilds, user, member, message) {
    super();


    const guildString = guilds.filter(guild => guild.members.get(user.id)).map(guild => guild.name).join('; ');
    this.author = {
      name: `${user.username}#${user.discriminator} | ${user.id}`,
      icon_url: user.displayAvatarURL,
    };
    this.thumbnail = {
      url: user.avatarURL,
    };
    this.fields = [
      {
        name: 'Profile',
        value: user.toString(),
        inline: true,
      },
      {
        name: 'Registered for Discord',
        value: user.createdAt.toLocaleString(),
        inline: true,
      },
      {
        name: 'Shared Servers (on this shard)',
        value: guildString.length > 0 ? guildString : 'None Shared',
        inline: true,
      },
    ];
    this.footer = {
      icon_url: user.defaultAvatarURL,
      text: `${user.username} is ${user.bot ? '' : 'not'} a bot`,
    };

    if (member) {
      this.fields = this.fields.concat([
        {
          name: 'nickname',
          value: member.displayName || 'none',
          inline: true,
        },
        {
          name: 'Owns the server?',
          value: member.id === message.guild.ownerID ? 'Yes' : 'No',
          inline: true,
        },
        {
          name: 'Status',
          value: member.presence.status,
          inline: true,
        },
        {
          name: 'Game',
          value: member.presence.game ? member.presence.game.name : 'No game',
          inline: true,
        },
        {
          name: 'Joined the Guild',
          value: member.joinedAt.toLocaleString(),
          inline: true,
        },
        {
          name: 'Current State:',
          value: `**Deafened:** ${member.deaf ? 'yes' : 'no'}\n` +
                  `**Kickable (by the bot):** ${member.kickable ? 'yes' : 'no'}\n` +
                  `**Muted:** ${member.mute ? 'yes' : 'no'}\n` +
                  `**Speaking:** ${member.speaking ? 'yes' : 'no'}\n` +
                  `**Guild Muted:** ${member.serverMute ? 'yes' : 'no'}\n` +
                  `**Guild Deafened:** ${member.serverDeaf ? 'yes' : 'no'}`,
          inline: true,
        },
        {
          name: 'Roles:',
          value: member.roles.array().length ? member.roles.map(role => role.name).join(', ') : 'User has no roles.',
          inline: true,
        },
      ]);
    }
  }
}

module.exports = UserInfoEmbed;
