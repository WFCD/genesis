'use strict';

const Command = require('../../models/Command.js');
const SettingsEmbed = require('../../embeds/SettingsEmbed.js');
const { createGroupedArray, getChannels, createPageCollector } = require('../../CommonFunctions');

class Settings extends Command {
  constructor(bot) {
    super(bot, 'settings.settings', 'settings', 'Get settings');
    this.regex = new RegExp(`^${this.call}(?:\\s+in\\s+((?:(?:<#)?\\d+(?:>)?)|current|all))?$`, 'i');
    this.requiresAuth = true;
  }

  async composeChannelSettings(channel, message) {
    const defaultRoles = JSON.parse(await this.settings.getGuildSetting(message.guild, 'defaultRoles') || '[]')
      .map(roleId => channel.guild.roles.get(roleId));
    let tokens = [
      `**Language:** ${await this.settings.getChannelSetting(channel, 'language')}`,
      `**Platform:** ${await this.settings.getChannelSetting(channel, 'platform')}`,
      `**Prefix:** ${await this.settings.getGuildSetting(message.guild, 'prefix')}`,
      `**Respond to Settings:** ${(await this.settings.getChannelSetting(channel, 'respond_to_settings')) === '1' ? 'yes' : 'no'}`,
      `**Delete Message After Responding:** ${(await this.settings.getChannelSetting(channel, 'delete_after_respond')) === '1' ? 'yes' : 'no'}`,
      `**Delete Message Response After Responding:** ${(await this.settings.getChannelSetting(channel, 'delete_response')) === '1' ? 'yes' : 'no'}`,
      `**Allow creation of private channels:** ${(await this.settings.getChannelSetting(channel, 'createPrivateChannel')) === '1' ? 'yes' : 'no'}`,
      `**Deleted Expired Notifications (not all):** ${(await this.settings.getChannelSetting(channel, 'deleteExpired')) === '1' ? 'yes' : 'no'}`,
      `**Allow Inline Commands:** ${(await this.settings.getChannelSetting(channel, 'allowInline')) === '1' ? 'yes' : 'no'}`,
      `**Allow Custom Commands:** ${(await this.settings.getChannelSetting(channel, 'allowCustom')) === '1' ? 'yes' : 'no'}`,
      `**Custom Commands Ping:** ${(await this.settings.getChannelSetting(channel, 'settings.cc.ping')) === '1' ? 'yes' : 'no'}`,
      `**Default Locked Channel:** ${(await this.settings.getChannelSetting(channel, 'defaultRoomsLocked')) === '1' ? 'yes' : 'no'}`,
      `**Default No Text Channel:** ${(await this.settings.getChannelSetting(channel, 'defaultNoText')) === '1' ? 'yes' : 'no'}`,
      `**Default Hidden Channel:** ${(await this.settings.getChannelSetting(channel, 'defaultShown')) === '1' ? 'yes' : 'no'}`,
    ];

    if (message.guild) {
      tokens = tokens.concat([
        `**Temp Channel Category:** ${message.guild.channels.get(await this.settings.getGuildSetting(message.guild, 'tempCategory')) || 'none defined'}`,
        `**LFG Channel:** ${message.guild.channels.get(await this.settings.getGuildSetting(message.guild, 'lfgChannel')) || 'none defined'}`,
        `**Default Roles:** ${defaultRoles.length ? defaultRoles : 'none defined'}`,
        `**Vulgar Log Channel:** ${message.guild.channels.get(await this.settings.getGuildSetting(message.guild, 'vulgarLog')) || 'none defined'}`,
        `**Message Delete Log Channel:** ${this.bot.client.channels.get(await this.settings.getGuildSetting(message.guild, 'msgDeleteLog')) || 'none defined'}`,
        `**Member Remove Log Channel:** ${message.guild.channels.get(await this.settings.getGuildSetting(message.guild, 'memberRemoveLog')) || 'none defined'}`,
        `**Ban Log Channel:** ${message.guild.channels.get(await this.settings.getGuildSetting(message.guild, 'banLog')) || 'none defined'}`,
        `**Unban Log Channel:** ${message.guild.channels.get(await this.settings.getGuildSetting(message.guild, 'unbanLog')) || 'none defined'}`,
        `**Mod Role:** ${message.guild.roles.get(await this.settings.getGuildSetting(message.guild, 'modRole')) || 'none defined'}`,
      ]);
    }
    const items = await this.settings.getTrackedItems(channel);
    if (items.length > 0) {
      tokens.push('\n**Tracked Items:**');
      const itemsGroups = createGroupedArray(items, 15);
      itemsGroups.forEach(group => tokens.push(group.join('; ')));
    } else {
      tokens.push('**Tracked Items:** No Tracked Items');
    }
    const events = await this.settings.getTrackedEventTypes(channel);
    if (events.length > 0) {
      tokens.push('**Tracked Events:**');
      const eventGroups = createGroupedArray(events, 15);
      eventGroups.forEach(group => tokens.push(group.join('; ')));
    } else {
      tokens.push('**Tracked Events:** No Tracked Events');
    }
    const permissions = await this.settings.permissionsForChannel(channel);
    const channelParts = permissions
      .map(obj => `**${obj.command}** ${obj.isAllowed ? 'allowed' : 'denied'} for ${this.evalAppliesTo(obj.type, obj.appliesToId, message)}`);
    const channelSections = createGroupedArray(channelParts, 5);
    const things = channelSections.map((item, index) => `${index > 0 ? '' : '\n**Channel Permissions:** \n'}${item.length > 0 ? `\t${item.join('\n\t')}` : 'No Configured Channel Permission'}`);
    tokens = tokens.concat(things);

    const tokenGroups = createGroupedArray(tokens, 10);
    const pages = [];
    // eslint-disable-next-line no-loop-func
    tokenGroups.forEach((tokenGroup) => {
      const embed = new SettingsEmbed(
        this.bot, channel,
        createGroupedArray(tokenGroup, 3),
      );
      pages.push(embed);
    });
    return pages;
  }

  async run(message) {
    const channelParam = message.strippedContent.match(this.regex)[1] || 'current';
    const channels = getChannels(channelParam.trim(), message);
    const channelsResults = [];
    let pages = [];
    for (const channel of channels) {
      pages = pages.concat(await this.composeChannelSettings(channel, message));
    }
    Promise.all(channelsResults);

    if (message.channel.guild) {
      let guildTokens = await this.settings.getWelcomes(message.guild);

      // Welcomes
      guildTokens = guildTokens.map(welcome => `**Welcome${welcome.isDm === '1' ? ' Direct ' : ' Message'}**\n${welcome.isDm === '1' ? '' : `\nChannel: ${welcome.channel}`} \nMessage: \`\`\`${welcome.message.replace(/`/ig, '\'')}\`\`\``);

      // Guild Pings
      const guildPings = await this.settings.getPingsForGuild(message.guild);
      const pingParts = guildPings
        .filter(obj => obj.thing && obj.text)
        .map(obj => `**${obj.thing}**: ${obj.text}`);
      if (pingParts.length > 0) {
        // add them all
        guildTokens.push('\n**Pings per Item:**');
        pingParts.forEach(item => guildTokens.push(`\t${item}`));
      } else {
        guildTokens.push('\n**Pings per Item:** No Configured Pings');
      }

      // Guild Permissions
      const guildPermissions = await this.settings.permissionsForGuild(message.guild);
      const guildParts = guildPermissions
        .map(obj => `**${obj.command}** ${obj.isAllowed ? 'allowed' : 'denied'} for ${this.evalAppliesTo(obj.type, obj.appliesToId, message)}`);

      if (guildParts.length > 0) {
        guildTokens.push('\n**Guild Permissions:**');
        guildParts.forEach(part => guildTokens.push(`\t${part}`));
      } else {
        guildTokens.push('\n**Guild Permissions:** No Configured Guild Permissions');
      }

      const tokenGroups = createGroupedArray(guildTokens, 30);
      // eslint-disable-next-line no-loop-func
      tokenGroups.forEach((tokenGroup) => {
        const embed = new SettingsEmbed(
          this.bot, message.channel,
          createGroupedArray(tokenGroup, 15),
        );
        pages.push(embed);
      });
      pages = pages.filter(page => JSON.stringify(page) !== '{}');

      if (pages.length) {
        const msg = await this.messageManager.embed(message, pages[0], false, false);
        await createPageCollector(msg, pages, message.author);
      }
      if (parseInt(await this.settings.getChannelSetting(message.channel, 'delete_after_respond'), 10) && message.deletable) {
        message.delete(10000);
      }
    }
    return this.messageManager.statuses.SUCCESS;
  }

  evalAppliesTo(type, id, message) {
    if (type === 'role') {
      return message.guild.roles.get(id);
    }
    if (id === message.guild.id) {
      return 'everyone';
    }
    return this.bot.client.users.get(id);
  }
}

module.exports = Settings;
