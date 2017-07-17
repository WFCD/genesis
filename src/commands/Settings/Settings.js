'use strict';

const Promise = require('bluebird');

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
    this.regex = new RegExp(`^${this.call}(?:\\s+in\\s+((?:(?:<#)?\\d+(?:>)?)|current|all))?$`, 'i');
    this.requiresAuth = true;
  }

  run(message) {
    const settings = [];
    const tracked = [];
    let lastIndex = 0;
    const channelParam = message.strippedContent.match(this.regex)[1] || 'current';
    const channels = this.getChannels(channelParam.trim(), message);
    Promise.each(channels, (channel) => {
      this.bot.settings.getChannelLanguage(channel)
        .then((language) => {
          settings.push({ name: 'Language', value: language, inline: true });
          return this.bot.settings.getChannelPlatform(channel);
        })
        .then((platform) => {
          settings.push({ name: 'Platform', value: platform, inline: true });
          return this.bot.settings.getChannelResponseToSettings(channel);
        })
        .then((respond) => {
          settings.push({ name: 'Respond to Settings', value: respond === '1' ? 'yes' : 'no', inline: true });
          return this.bot.settings.getChannelDeleteAfterResponse(channel);
        })
        .then((deleteAfterRespond) => {
          settings.push({ name: 'Delete Message After Responding', value: deleteAfterRespond === '1' ? 'yes' : 'no', inline: true });
          return this.bot.settings.getChannelSetting(channel, 'delete_response');
        })
        .then((deleteResponseAfterRespond) => {
          settings.push({ name: 'Delete Message Response After Responding', value: deleteResponseAfterRespond === '1' ? 'yes' : 'no', inline: true });
          return this.bot.settings.getChannelPrefix(channel);
        })
        .then((prefix) => {
          settings.push({ name: 'Command Prefix', value: prefix, inline: true });
          return this.bot.settings.getChannelSetting(channel, 'createPrivateChannel');
        })
        .then((privChan) => {
          settings.push({ name: 'Allow creation of private channels', value: privChan === '1' ? 'yes' : 'no', inline: true });
          return this.bot.settings.getChannelSetting(channel, 'deleteExpired');
        })
        .then((deleteExpired) => {
          settings.push({ name: 'Deleted Expired Notifications (not all)', value: deleteExpired === '1' ? 'yes' : 'no', inline: true });
          const embed = new SettingsEmbed(this.bot, channel, settings, lastIndex + 1);
          lastIndex += 1;
          this.messageManager.embed(message, embed, false, false);
          return this.bot.settings.getTrackedItems(channel);
        })
        .then((items) => {
          tracked.push({
            name: 'Tracked Items',
            value: items.length > 0 ? `\n${items.join(' ')}` : 'No Tracked Items',
            inline: true,
          });
          return this.bot.settings.getTrackedEventTypes(channel);
        })
        .then((types) => {
          tracked.push({
            name: 'Tracked Events',
            value: types.length > 0 ? `\n${types.join(' ')}` : 'No Tracked Event Types',
            inline: true,
          });
          const embed = new SettingsEmbed(this.bot, channel, tracked, lastIndex + 1);
          lastIndex += 1;
          this.messageManager.embed(message, embed, false, false);
          return this.bot.settings.permissionsForChannel(channel);
        })
        .then((permissions) => {
          const channelParts = permissions
                    .map(obj => `**${obj.command}** ${obj.isAllowed ? 'allowed' : 'denied'} for ${this.evalAppliesTo(obj.type, obj.appliesToId, message)}`);
          const channelSections = createGroupedArray(channelParts, 15);
          channelSections.forEach((item, index) => {
            const val = [{
              name: 'Channel Permissions',
              value: item.length > 0 ? `\n\t${item.join('\n\t')}` : 'No Configured Channel Permission',
              inline: false,
            }];
            const embed = new SettingsEmbed(this.bot, message.channel, val,
              lastIndex + index);
            this.messageManager.embed(message, embed, false, false);
          });
          lastIndex += channelSections.length;
        });
    })
    .catch(this.logger.error);

    this.bot.settings.getPingsForGuild(message.guild)
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
            lastIndex += 1;
            this.messageManager.embed(message, embed, false, false);
          });
        }
      })
      .then(() => this.bot.settings.permissionsForGuild(message.guild))
      .then((permissions) => {
        const guildParts = permissions
                  .map(obj => `**${obj.command}** ${obj.isAllowed ? 'allowed' : 'denied'} for ${this.evalAppliesTo(obj.type, obj.appliesToId, message)}`);
        const guildSections = createGroupedArray(guildParts, 15);
        guildSections.forEach((item, index) => {
          const val = [{
            name: 'Guild Permissions',
            value: item.length > 0 ? `\n\t${item.join('\n\t')}` : 'No Configured Guild Permission',
            inline: false,
          }];
          const embed = new SettingsEmbed(this.bot, message.channel, val, lastIndex + index);
          this.messageManager.embed(message, embed, false, false);
        });
        lastIndex += guildSections.length;
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

  /**
   * Get the list of channels to enable commands in based on the parameters
   * @param {string|Array<Channel>} channelsParam parameter for determining channels
   * @param {Message} message Discord message to get information on channels
   * @returns {Array<string>} channel ids to enable commands in
   */
  getChannels(channelsParam, message) {
    let channels = [];
    if (typeof channelsParam === 'string') {
      // handle it for strings
      if (channelsParam !== 'all' && channelsParam !== 'current') {
        channels.push(this.bot.client.channels.get(channelsParam.trim().replace(/(<|>|#)/ig, '')));
      } else if (channelsParam === 'all') {
        channels = channels.concat(message.guild.channels.array().filter(channel => channel.type === 'text'));
      } else if (channelsParam === 'current') {
        channels.push(message.channel);
      }
    } else {
      channels.concat(channelsParam);
    }
    return channels;
  }
}

module.exports = Settings;
