'use strict';

const { RichEmbed } = require('discord.js');
const Command = require('../../models/Command.js');
const { getChannels, createPageCollector } = require('../../CommonFunctions');

const chunkify = ({
  string, newStrings = [], breakChar = '; ', maxLength = 1000,
}) => {
  let breakIndex;
  let chunk;
  if (string.length > maxLength) {
    while (string.length > 0) {
      // Split message at last break character, if it exists
      chunk = string.substring(0, maxLength);
      breakIndex = chunk.lastIndexOf(breakChar) !== -1 ? chunk.lastIndexOf(breakChar) : maxLength;
      newStrings.push(string.substring(0, breakIndex));
      // Skip char if split on line break
      if (breakIndex !== maxLength) {
        breakIndex += 1;
      }
      // eslint-disable-next-line no-param-reassign
      string = string.substring(breakIndex, string.length);
    }
  }
  newStrings.push(string);
  return newStrings;
};

const stringFilter = chunk => chunk && chunk.length;

const embedDefaults = {
  color: 0x77dd77,
  url: 'https://warframestat.us/',
  footer: {
    text: 'Sent',
    icon_url: 'https://warframestat.us/wfcd_logo_color.png',
  },
  timestamp: new Date(),
};

const createChunkedEmbed = (stringToChunk, title, breakChar) => {
  const embed = new RichEmbed(embedDefaults);
  embed.setTitle(title);
  const chunks = chunkify({ string: stringToChunk, breakChar }).filter(stringFilter);
  if (chunks.length) {
    chunks.forEach((chunk) => {
      embed.addField('\u200B', chunk, true);
    });
  } else {
    embed.setDescription(`No ${title}`);
  }
  return embed;
};

const nonCompact = new RegExp('--expand', 'ig');

class Settings extends Command {
  constructor(bot) {
    super(bot, 'settings.settings', 'settings', 'Get settings');
    this.regex = new RegExp(`^${this.call}(?:\\s*--expand)?(?:\\s+in\\s+((?:(?:<#)?\\d+(?:>)?)|current|all))?$`, 'i');
    this.requiresAuth = true;
  }

  async composeChannelSettings(channel, message) {
    const page = new RichEmbed(embedDefaults);
    page.setTitle('General Settings');
    page.addField('Language', await this.settings.getChannelSetting(channel, 'language'), true);
    page.addField('Platform', await this.settings.getChannelSetting(channel, 'platform'), true);
    page.addField('Prefix', await this.settings.getGuildSetting(message.guild, 'prefix'), true);
    page.addField('Private Channels', await this.resolveBoolean(channel, 'createPrivateChannel'), true);
    page.addField('Deleted Expired', await this.resolveBoolean(channel, 'deleteExpired'), true);
    page.addField('Allow Inline', await this.resolveBoolean(channel, 'allowInline'), true);
    page.addField('Allow Custom', await this.resolveBoolean(channel, 'allowCustom'), true);
    page.addField('Ping Custom', await this.resolveBoolean(channel, 'settings.cc.ping'), true);
    page.addField('Locked Channel', await this.resolveBoolean(channel, 'defaultRoomsLocked'), true);
    page.addField('No Text Channel', await this.resolveBoolean(channel, 'defaultNoText'), true);
    page.addField('Hidden Channel', await this.resolveBoolean(channel, 'defaultShown'), true);
    page.addField('Respond to Settings', await this.resolveBoolean(channel, 'respond_to_settings'), true);
    page.addField('Delete Message Post-Respond', await this.resolveBoolean(channel, 'delete_after_respond'), true);
    page.addField('Delete Response Post-Respond', await this.resolveBoolean(channel, 'delete_response'), true);

    const defaultRoles = JSON.parse(await this.settings.getGuildSetting(message.guild, 'defaultRoles') || '[]')
      .map(roleId => channel.guild.roles.get(roleId));

    if (message.guild) {
      const category = await this.settings.getGuildSetting(message.guild, 'tempCategory');
      page.addField('Temp Channel Category', category !== '0' ? category : '✘', true);
      page.addField('LFG', await this.settings.getGuildSetting(message.guild, 'lfgChannel') || '✘', true);
      page.addField('Default Roles', defaultRoles.length ? defaultRoles : '✘', true);
      page.addField('Vulgar Log', await this.settings.getGuildSetting(message.guild, 'vulgarLog') || '✘', true);
      page.addField('Delete Log', await this.settings.getGuildSetting(message.guild, 'msgDeleteLog') || '✘', true);
      page.addField('Leave Log', await this.settings.getGuildSetting(message.guild, 'memberRemoveLog') || '✘', true);
      page.addField('Ban Log', await this.settings.getGuildSetting(message.guild, 'banLog') || '✘', true);
      page.addField('Unban Log', await this.settings.getGuildSetting(message.guild, 'unbanLog') || '✘', true);
      page.addField('Mod Role', await this.settings.getGuildSetting(message.guild, 'modRole') || '✘', true);
    }

    const items = await this.settings.getTrackedItems(channel);
    const trackedItems = createChunkedEmbed(items.join('; '), 'Tracked Items', '; ');

    const events = await this.settings.getTrackedEventTypes(channel);
    const trackedEvents = createChunkedEmbed(events.join('; '), 'Tracked Events', '; ');

    const permissions = (await this.settings.permissionsForChannel(channel))
      .map(obj => `**${obj.command}** ${obj.isAllowed ? 'allowed' : 'denied'} for ${this.evalAppliesTo(obj.type, obj.appliesToId, message)}`)
      .join('\n');

    const permPage = createChunkedEmbed(permissions, 'Channel Permissions', '\n');

    return [page, trackedItems, trackedEvents, permPage];
  }

  async resolveBoolean(channel, setting) {
    return ((await this.settings.getChannelSetting(channel, setting)) === '1' ? '✓' : '✘');
  }

  async run(message) {
    const channelParam = message.strippedContent.match(this.regex)[1] || 'current';
    const channels = getChannels(channelParam.trim(), message);
    let pages = [];
    for (const channel of channels) {
      pages = pages.concat(await this.composeChannelSettings(channel, message));
    }

    if (message.channel.guild) {
      // Welcomes
      const welcomePage = new RichEmbed(embedDefaults);
      const welcomes = await this.settings.getWelcomes(message.guild);
      welcomePage.setTitle('Welcomes');
      if (!welcomes.length) {
        welcomePage.setDescription('No Welcomes Configured');
      }
      welcomes.forEach((welcome) => {
        const msgs = chunkify({ string: welcome.message });
        msgs.forEach((msg, index) => {
          if (index === 0) {
            welcomePage.addField(`${welcome.isDm === '1' ? ' DM' : ' Message'} • ${welcome.channel.name}`, `\`\`\`${msg}\`\`\``);
          } else {
            welcome.addField('\u200B', `\`\`\`${msg}\`\`\``);
          }
        });
      });
      pages.push(welcomePage);

      // Guild Pings
      const guildPings = await this.settings.getPingsForGuild(message.guild);
      const pingParts = guildPings
        .filter(obj => obj.thing && obj.text)
        .map(obj => `**${obj.thing}**: ${obj.text}`)
        .join('\n');
      pages.push(createChunkedEmbed(pingParts, 'Pings', '\n'));

      // Guild Permissions
      const guildPermissions = await this.settings.permissionsForGuild(message.guild);
      const guildParts = guildPermissions
        .map(obj => `**${obj.command}** ${obj.isAllowed ? 'allowed' : 'denied'} for ${this.evalAppliesTo(obj.type, obj.appliesToId, message)}`).join('\n');
      pages.push(createChunkedEmbed(guildParts, 'Guild Permissions', '\n'));

      pages = pages.filter(page => JSON.stringify(page) !== '{}');

      if (pages.length) {
        if (nonCompact.test(message.strippedContent)) {
          pages.forEach(async (page) => {
            await this.messageManager.embed(message, page, false, false);
          });
        } else {
          const msg = await this.messageManager.embed(message, pages[0], false, false);
          await createPageCollector(msg, pages, message.author);
        }
      } else {
        this.messageManager.reply(message, 'Can\'t give you settings. Something went wrong.', true, true);
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
