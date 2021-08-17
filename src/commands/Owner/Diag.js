'use strict';

const { MessageEmbed } = require('discord.js');

const Command = require('../../models/Command.js');
const { timeDeltaToString, chunkFields, emojify } = require('../../CommonFunctions.js');

const check = emojify('green_tick');
const xmark = emojify('red_tick');
const empty = emojify('empty');

/**
 * Displays the response time for the bot and checks Warframe's servers to see if they are up
 */
class Diagnostics extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot The bot object
   */
  constructor(bot) {
    super(bot, 'core.diag', 'diag', 'Run some basic diagnostics', 'CORE');
    this.requiresAuth = true;
    this.allowDM = false;
  }

  /**
   * Run the command
   * @param {Message} message Message with a command to handle, reply to,
   *                          or perform an action based on parameters.
   * @returns {string} success status
   */
  async run(message) {
    const embed = new MessageEmbed();
    embed.setTitle(`Diagnostics for Shard ${message.guild.shardId + 1}/${this.bot.shardTotal}/${this.bot.clusterId}`);

    embed.addField('Discord WS', `${check} ${this.bot.client.ws.ping.toFixed(2)}ms`, true);

    // check what permissions the bot has in the current channel
    const perms = message.channel.permissionsFor(this.bot.client.user.id);

    // role management
    const rolePermTokens = [];
    rolePermTokens.push(`${perms.has('MANAGE_ROLES') ? check : xmark} Permission Present`);
    rolePermTokens.push(`${empty} Bot role position: ${message.guild.me.roles.highest.position}`);

    const rolesForGuild = await this.settings.getRolesForGuild(message.guild);

    if (rolesForGuild.length) {
      rolesForGuild.forEach((role) => {
        const canBeManaged = message.guild.me.roles.highest.comparePositionTo(role.guildRole) > 0;
        rolePermTokens.push(`${canBeManaged ? `${check} Manageable ` : `${xmark} Unmanageable `} \`${role.guildRole.name}\`\n  \\➡ ID: \`${role.guildRole.id}\`\n  \\➡ Position: \`${role.guildRole.position}\``);
      });
    } else {
      rolePermTokens.push(`${xmark} Not configured to manage any roles.`);
    }
    chunkFields(rolePermTokens, 'Can Manage Roles', '\n')
      .forEach((field) => {
        embed.addField(field.name, field.value, false);
      });

    // Tracking
    const trackingReadinessTokens = [`${perms.has('MANAGE_WEBHOOKS') ? `${check}  Can` : `${xmark} Cannot`} Manage Webhooks`];

    const trackables = {
      events: await this.settings.getTrackedEventTypes(message.channel),
      items: await this.settings.getTrackedItems(message.channel),
    };
    trackingReadinessTokens.push(trackables.events.length ? `${check} ${trackables.events.length} Events Tracked` : `${xmark} No Events tracked`);
    trackingReadinessTokens.push(trackables.items.length ? `${check} ${trackables.items.length} Items Tracked` : `${xmark} No Items tracked`);

    embed.addField('Trackable Ready', trackingReadinessTokens.join('\n'));

    // General
    embed.addField('General Ids', `Guild: \`${message.guild.id}\`\nChannel: \`${message.channel.id}\``);

    embed.setTimestamp(new Date());
    embed.setFooter(`Uptime: ${timeDeltaToString(this.bot.client.uptime)} `);

    await message.reply({ embeds: [embed] });
    return this.messageManager.statuses.SUCCESS;
  }
}

module.exports = Diagnostics;
