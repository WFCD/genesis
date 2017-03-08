'use strict';

const Command = require('../../Command.js');

/**
 * Get info about a user
 */
class UserInfo extends Command {
  /**
   * Constructs a callable command
   * @param {Bot} bot The bot object
   */
  constructor(bot) {
    super(bot, 'util.userinfo', 'userinfo', 'Get info about a user');
    this.regex = new RegExp(`^${this.call}\\s*((?:\\<\\@?\\!?)?\\d+(?:\\>)?)?`)
  }

  /**
   * Run the command
   * @param {Message} message Message with a command to handle, reply to,
   *                          or perform an action based on parameters.
   */
  run(message) {
    const params = message.strippedContent.match(this.regex);
    let user;
    let member;
    if (params[1] || (message.mentions.users && message.mentions.users.array()[0])) {
        user = message.mentions.users.array()[0] || this.bot.client.users.get(params[1].trim());
    } else {
        user = message.author;
    }
    if (user && message.guild) {
        member = message.guild.members.get(user.id)
    }
    if (!user) {
        this.messageManager.reply(message, 'can\'t find that user. Please specify another.', false, false);
        return;
    }
    const embed = {
      author: {
        name: `${user.username}#${user.discriminator} | ${user.id}`,
        icon_url: user.displayAvatarURL,
      },
      thumbnail: {
        url: user.avatarURL,
      },
      fields: [
        {
            name: 'Registered for Discord',
            value: user.createdAt.toLocaleString(),
            inline: true,
        },
        {
            name: 'Shared Servers (on this shard)',
            value: this.bot.client.guilds.filter(guild => guild.members.get(user.id)).map(guild => guild.name).join('; '),
            inline: true,
        }
      ],
      footer: {
        icon_url: user.defaultAvatarURL,
        text: `${new Date().toLocaleString()} | ${user.username} is ${user.bot ? '' : 'not'} a bot`
      },
    };

    if (member) {
        embed.fields = embed.fields.concat([
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
    this.messageManager.embed(message, embed, true, false);
  }
}

module.exports = UserInfo;
