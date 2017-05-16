'use strict';

const Command = require('../../Command.js');
const SettingsEmbed = require('../../embeds/SettingsEmbed.js');

function createGroupedArray(arr, chunkSize) {
  const groups = [];
  for (let i = 0; i < arr.length; i += chunkSize) {
    groups.push(arr.slice(i, i + chunkSize));
  }
  return groups;
}

class Settings extends Command {
  constructor(bot) {
    super(bot, 'settings.settings', 'settings', 'Get settings');
    this.regex = new RegExp(`^${this.call}$`, 'i');
    this.requiresAuth = true;
  }

  run(message) {
    const settings = [];
    const tracked = [];
    let perms = [];
    let finalPingIndex = 3;
    this.bot.settings.getChannelLanguage(message.channel)
      .then((language) => {
        settings.push({ name: 'Language', value: language, inline: true });
        return this.bot.settings.getChannelPlatform(message.channel);
      })
      .then((platform) => {
        settings.push({ name: 'Platform', value: platform, inline: true });
        return this.bot.settings.getChannelResponseToSettings(message.channel);
      })
      .then((respond) => {
        settings.push({ name: 'Respond to Settings', value: respond === '1' ? 'yes' : 'no', inline: true });
        return this.bot.settings.getChannelDeleteAfterResponse(message.channel);
      })
      .then((deleteAfterRespond) => {
        settings.push({ name: 'Delete Message After Responding', value: deleteAfterRespond === '1' ? 'yes' : 'no', inline: true });
        return this.bot.settings.getChannelPrefix(message.channel);
      })
      .then((prefix) => {
        settings.push({ name: 'Command Prefix', value: prefix, inline: true });
        return this.bot.settings.getChannelSetting(message.channel, 'createPrivateChannel');
      })
      .then((privChan) => {
        settings.push({ name: 'Allow creation of private channels', value: privChan === '1' ? 'yes' : 'no', inline: true });
        const embed = new SettingsEmbed(this.bot, message.channel, settings, 1);
        this.messageManager.embed(message, embed, false, false);
        return this.bot.settings.getTrackedItems(message.channel);
      })
      .then((items) => {
        tracked.push({
          name: 'Tracked Items',
          value: items.length > 0 ? `\n${items.join(' ')}` : 'No Tracked Items',
          inline: true,
        });
        return this.bot.settings.getTrackedEventTypes(message.channel);
      })
      .then((types) => {
        tracked.push({
          name: 'Tracked Events',
          value: types.length > 0 ? `\n${types.join(' ')}` : 'No Tracked Event Types',
          inline: true,
        });
        const embed = new SettingsEmbed(this.bot, message.channel, tracked, 2);
        this.messageManager.embed(message, embed, false, false);
        return this.bot.settings.getPingsForGuild(message.guild);
      })
      .then((pingsArray) => {
        if (pingsArray.length > 0) {
          const pingParts = pingsArray
                    .filter(obj => obj.thing && obj.text)
                    .map(obj => `**${obj.thing}**: ${obj.text}`);
          const pingSections = createGroupedArray(pingParts, 10);

          pingSections.forEach((item, index) => {
            const val = [{
              name: 'Pings per Item',
              value: item.length > 0 ? `\n\t${item.join('\n\t')}` : 'No Configured Pings',
              inline: false,
            }];
            const embed = new SettingsEmbed(this.bot, message.channel, val, 3 + index);
            finalPingIndex += 1;
            this.messageManager.embed(message, embed, false, false);
          });
        }
      })
      .then(() => this.bot.settings.permissionsForGuild(message.guild))
      .then((permissions) => {
        perms = perms.concat(permissions);
        return this.bot.settings.permissionsForChannel(message.channel);
      })
      .then((permissions) => {
        const channelParts = permissions
                  .map(obj => `**${obj.command}** ${obj.isAllowed ? 'allowed' : 'denied'} for ${this.evalAppliesTo(obj.type, obj.appliesToId, message)}`);
        const guildParts = perms
                  .map(obj => `**${obj.command}** ${obj.isAllowed ? 'allowed' : 'denied'} for ${this.evalAppliesTo(obj.type, obj.appliesToId, message)}`);
        const channelSections = createGroupedArray(channelParts, 20);
        const guildSections = createGroupedArray(guildParts, 20);
        let finalGuildIndex = finalPingIndex;
        guildSections.forEach((item, index) => {
          const val = [{
            name: 'Guild Permissions',
            value: item.length > 0 ? `\n\t${item.join('\n\t')}` : 'No Configured Guild Permission',
            inline: false,
          }];
          const embed = new SettingsEmbed(this.bot, message.channel, val, finalPingIndex + index);
          finalGuildIndex += 1;
          this.messageManager.embed(message, embed, false, false);
        });
        channelSections.forEach((item, index) => {
          const val = [{
            name: 'Channel Permissions',
            value: item.length > 0 ? `\n\t${item.join('\n\t')}` : 'No Configured Channel Permission',
            inline: false,
          }];
          const embed = new SettingsEmbed(this.bot, message.channel, val, finalGuildIndex + index);
          this.messageManager.embed(message, embed, false, false);
        });
      })
      .catch(this.logger.error);
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
