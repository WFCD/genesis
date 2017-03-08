'use strict';

const Command = require('../../Command.js');
const verificationLevels = ['None', 'Low\nMust have a verified email on their Discord Account', 'Medium\nMust also be registered on Discord for longer than 5 minutes', '(╯°□°）╯︵ ┻━┻\nMust also be a member of this server for longer than 10 minutes.'];
const verificationColors = [0x747f8d, 0x43b581, 0xfaa61a, 0xf04747];

/**
 * Get a list of all servers
 */
class ServerInfo extends Command {
  /**
   * Constructs a callable command
   * @param {Bot} bot The bot object
   */
  constructor(bot) {
    super(bot, 'util.serverInfo', 'serverinfo', 'Get info about current server');
  }

  /**
   * Run the command
   * @param {Message} message Message with a command to handle, reply to,
   *                          or perform an action based on parameters.
   */
  run(message) {
    const guild = message.guild;
    const embed = {
      title: guild.name,
      description: `**Region:** ${guild.region}`,
      color: verificationColors[guild.verificationLevel],
      thumbnail: {
        url: guild.iconURL,
      },
      fields: [
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
          value: guild.channels.filterArray(channel => channel.type === 'text').length,
          inline: true,
        },
        {
          name: 'Voice Channels:',
          value: guild.channels.filterArray(channel => channel.type === 'voice').length,
          inline: true,
        },
        {
          name: 'Members:',
          value: `${guild.members.filterArray(member => member.presence.status === 'online' || member.presence.status === 'idle' || member.presence.status === 'dnd').length}/${guild.memberCount}`,
          inline: true,
        },
        {
          name: 'Emojis:',
          value: `Count: ${guild.emojis.array().length}`,
          inline: true,
        },
        {
          name: 'Default Channel:',
          value: `${guild.defaultChannel.name} (${guild.defaultChannel})`,
          inline: true,
        },
        {
          name: 'Verification Level:',
                   value: verificationLevels[guild.verificationLevel],
          inline: true,
        },
        {
          name: 'Roles:',
          value: `Count: ${guild.roles.array().length} \n`+
                  `${guild.roles.map(role => role.name).join(', ')}`,
          inline: true,
        },
      ],
      footer: {
        text: `Server ID: ${guild.id}`
      },
    };
    message.channel.sendEmbed(embed).catch(this.logger.error);
  }
}

module.exports = ServerInfo;
