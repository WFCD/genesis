'use strict';

const Command = require('../../Command.js');
const SettingsEmbed = require('../../embeds/SettingsEmbed.js');
const { createGroupedArray, getChannels } = require('../../CommonFunctions');

class Settings extends Command {
  constructor(bot) {
    super(bot, 'settings.settings', 'settings', 'Get settings');
    this.regex = new RegExp(`^${this.call}(?:\\s+in\\s+((?:(?:<#)?\\d+(?:>)?)|current|all))?$`, 'i');
    this.requiresAuth = true;
  }

  async composeChannelSettings(channel, message) {
    let tokens = [
      `**Language:** ${await this.bot.settings.getChannelSetting(channel, 'language')}`,
      `**Platform:** ${await this.bot.settings.getChannelSetting(channel, 'platform')}`,
      `**Prefix:** ${await this.bot.settings.getGuildSetting(message.guild, 'prefix')}`,
      `**Respond to Settings:** ${(await this.bot.settings.getChannelSetting(channel, 'respond_to_settings')) === '1' ? 'yes' : 'no'}`,
      `**Delete Message After Responding:** ${(await this.bot.settings.getChannelSetting(channel, 'delete_after_respond')) === '1' ? 'yes' : 'no'}`,
      `**Delete Message Response After Responding:** ${(await this.bot.settings.getChannelSetting(channel, 'delete_response')) === '1' ? 'yes' : 'no'}`,
      `**Allow creation of private channels:** ${(await this.bot.settings.getChannelSetting(channel, 'createPrivateChannel')) === '1' ? 'yes' : 'no'}`,
      `**Deleted Expired Notifications (not all):** ${(await this.bot.settings.getChannelSetting(channel, 'deleteExpired')) === '1' ? 'yes' : 'no'}`,
      `**Allow Inline Commands:** ${(await this.bot.settings.getChannelSetting(channel, 'allowInline')) === '1' ? 'yes' : 'no'}`,
      `**Allow Custom Commands:** ${(await this.bot.settings.getChannelSetting(channel, 'allowCustom')) === '1' ? 'yes' : 'no'}`,
      `**Default Locked Channel:** ${(await this.bot.settings.getChannelSetting(channel, 'defaultRoomsLocked')) === '1' ? 'yes' : 'no'}`,
      `**Default No Text Channel:** ${(await this.bot.settings.getChannelSetting(channel, 'defaultNoText')) === '1' ? 'yes' : 'no'}`,
    ];
    const items = await this.bot.settings.getTrackedItems(channel);
    if (items.length > 0) {
      tokens.push('\n**Tracked Items:**');
      const itemsGroups = createGroupedArray(items, 15);
      itemsGroups.forEach(group => tokens.push(group.join('; ')));
    } else {
      tokens.push('**Tracked Items:** No Tracked Items');
    }
    const events = await this.bot.settings.getTrackedEventTypes(channel);
    if (events.length > 0) {
      tokens.push('**Tracked Events:**');
      const eventGroups = createGroupedArray(events, 15);
      eventGroups.forEach(group => tokens.push(group.join('; ')));
    } else {
      tokens.push('**Tracked Events:** No Tracked Events');
    }
    const permissions = await this.bot.settings.permissionsForChannel(channel);
    const channelParts = permissions
      .map(obj => `**${obj.command}** ${obj.isAllowed ? 'allowed' : 'denied'} for ${this.evalAppliesTo(obj.type, obj.appliesToId, message)}`);
    const channelSections = createGroupedArray(channelParts, 5);
    const things = channelSections.map((item, index) => `${index > 0 ? '' : '\n**Channel Permissions:** \n'}${item.length > 0 ? `\t${item.join('\n\t')}` : 'No Configured Channel Permission'}`);
    tokens = tokens.concat(things);

    const tokenGroups = createGroupedArray(tokens, 6);
    // eslint-disable-next-line no-loop-func
    tokenGroups.forEach((tokenGroup) => {
      const embed = new SettingsEmbed(
        this.bot, channel,
        createGroupedArray(tokenGroup, 3),
      );
      this.messageManager.embed(message, embed);
    });
  }

  async run(message) {
    const channelParam = message.strippedContent.match(this.regex)[1] || 'current';
    const channels = getChannels(channelParam.trim(), message);
    const channelsResults = [];
    for (const channel of channels) {
      channelsResults.push(this.composeChannelSettings(channel, message));
    }
    Promise.all(channelsResults);

    if (message.channel.guild) {
      let guildTokens = await this.bot.settings.getWelcomes(message.guild);

      // Welcomes
      guildTokens = guildTokens.map(welcome => `**Welcome${welcome.isDm === '1' ? ' Direct ' : ' Message'}**\n${welcome.isDm === '1' ? '' : `\nChannel: ${welcome.channel}`} \nMessage: \`\`\`${welcome.message.replace(/`/ig, '\'')}\`\`\``);

      // Guild Pings
      const guildPings = await this.bot.settings.getPingsForGuild(message.guild);
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
      const guildPermissions = await this.bot.settings.permissionsForGuild(message.guild);
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
        this.messageManager.embed(message, embed);
      });
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
