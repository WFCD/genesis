'use strict';

const { RichEmbed } = require('discord.js');
const Command = require('../../models/Command.js');
const { getChannels, createPageCollector, createGroupedArray } = require('../../CommonFunctions');

const negate = '✘';
const affirm = '✓';

const wrapChannelValue = (val) => {
  if (val !== negate) {
    return `<#${val}>`;
  }
  return val;
}

const wrapRoleValue = (val) => {
  if (val !== negate) {
    return `<@&${val}>`;
  }
  return val;
}

const checkAndMergeEmbeds = (original, value) => {
  if (value instanceof Array) {
    original.push(...value);
  } else {
    original.push(value);
  }
}

const fieldLimit = 5;

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
    chunks.forEach((chunk, index) => {
      if (index > 0) {
        embed.addField('\u200B', chunk, true);
      } else {
        embed.setDescription(chunk);
      }
    });
  } else {
    embed.setDescription(`No ${title}`);
  }

  if (embed.fields.length > fieldLimit) {
    const fieldGroups = createGroupedArray(embed.fields, fieldLimit);
    const embeds = [];
    fieldGroups.forEach((fields, index) => {
      const smEmbed = new RichEmbed(embedDefaults);
      embed.setTitle(title);

      smEmbed.fields = fields;
      if(index === 0) {
        smEmbed.setDescription(embed.description);
      }
      embeds.push(smEmbed);
    });
    return embeds;
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
    const settings = await this.settings.getChannelSettings(channel, [
      'language',
      'platform',
      'prefix',
      'createPrivateChannel',
      'deleteExpired',
      'allowInline',
      'allowCustom',
      'settings.cc.ping',
      'defaultRoomsLocked',
      'defaultNoText',
      'defaultShown',
      'respond_to_settings',
      'respond_to_settings',
      'delete_after_respond',
      'delete_response',
      'defaultRoles',
      'tempCategory',
      'lfgChannel',
      'vulgarLog',
      'msgDeleteLog',
      'memberRemoveLog',
      'banLog',
      'unbanLog',
      'modRole',
    ]);

    page.setTitle('General Settings');
    page.addField('Language', settings.language || this.bot.settings.defaults.language, true);
    page.addField('Platform', settings.platform || this.bot.settings.defaults.platform, true);
    page.addField('Prefix', settings.prefix || this.bot.settings.defaults.prefix, true);
    page.addField('Private Room', await this.resolveBoolean(channel, 'createPrivateChannel', settings), true);
    page.addField('Deleted Expired', await this.resolveBoolean(channel, 'deleteExpired', settings), true);
    page.addField('Allow Inline', await this.resolveBoolean(channel, 'allowInline', settings), true);
    page.addField('Allow Custom', await this.resolveBoolean(channel, 'allowCustom', settings), true);
    page.addField('Ping Custom', await this.resolveBoolean(channel, 'settings.cc.ping', settings), true);
    page.addField('Locked Channel', await this.resolveBoolean(channel, 'defaultRoomsLocked', settings), true);
    page.addField('No Text Channel', await this.resolveBoolean(channel, 'defaultNoText', settings), true);
    page.addField('Hidden Channel', await this.resolveBoolean(channel, 'defaultShown', settings), true);
    page.addField('Respond to Settings', await this.resolveBoolean(channel, 'respond_to_settings', settings), true);
    page.addField('Delete Message', await this.resolveBoolean(channel, 'delete_after_respond', settings), true);
    page.addField('Delete Response', await this.resolveBoolean(channel, 'delete_response', settings), true);

    const defaultRoles = JSON.parse(settings.defaultRoles || '[]')
      .map(roleId => channel.guild.roles.get(roleId) || undefined)
      .filter(role => role)
      .map(role => role.toString())
      .join(', ');

    if (message.guild) {
      const tempCategory = settings.tempCategory !== '0'
        && typeof settings.tempCategory !== 'undefined'
        ? settings.tempCategory : negate;
      page.addField('Temp Channel Category', wrapChannelValue(tempCategory), true);
      page.addField('LFG', wrapChannelValue(settings.lfgChannel || negate), true);
      page.addField('Default Roles', defaultRoles.length ? defaultRoles : negate, true);
      page.addField('Vulgar Log', wrapChannelValue(settings.vulgarLog || negate), true);
      page.addField('Delete Log', wrapChannelValue(settings.msgDeleteLog || negate), true);
      page.addField('Leave Log', wrapChannelValue(settings.memberRemoveLog || negate), true);
      page.addField('Ban Log', wrapChannelValue(settings.banLog || negate), true);
      page.addField('Unban Log', wrapChannelValue(settings.unbanLog || negate), true);
      page.addField('Mod Role', wrapRoleValue(settings.modRole || negate), true);
    }

    const items = await this.settings.getTrackedItems(channel);
    const trackedItems = createChunkedEmbed(items.join('; '), 'Tracked Items', '; ');

    const events = await this.settings.getTrackedEventTypes(channel);
    const trackedEvents = createChunkedEmbed(events.join('; '), 'Tracked Events', '; ');

    const permissions = (await this.settings.permissionsForChannel(channel))
      .map(obj => `**${obj.command}** ${obj.isAllowed ? 'allowed' : 'denied'} for ${this.evalAppliesTo(obj.type, obj.appliesToId, message)}`)
      .join('\n');

    const permPage = createChunkedEmbed(permissions, 'Channel Permissions', '\n');

    const embeds = [page];
    checkAndMergeEmbeds(embeds, trackedItems);
    checkAndMergeEmbeds(embeds, trackedEvents);
    checkAndMergeEmbeds(embeds, permPage);
    return embeds;
  }

  async resolveBoolean(channel, setting, settings) {
    if (settings) {
      return settings.setting === '1' ? affirm : negate;
    }
    return ((await this.settings.getChannelSetting(channel, setting)) === '1' ? affirm : negate);
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
      checkAndMergeEmbeds(pages, createChunkedEmbed(pingParts, 'Pings', '\n'));

      // Guild Permissions
      const guildPermissions = await this.settings.permissionsForGuild(message.guild);
      const guildParts = guildPermissions
        .map(obj => `**${obj.command}** ${obj.isAllowed ? 'allowed' : 'denied'} for ${this.evalAppliesTo(obj.type, obj.appliesToId, message)}`).join('\n');
      checkAndMergeEmbeds(pages, createChunkedEmbed(guildParts, 'Guild Permissions', '\n'));

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
