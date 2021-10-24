'use strict';

const {
  // eslint-disable-next-line no-unused-vars
  Constants: { ApplicationCommandOptionTypes: Types }, CommandInteraction, TextChannel,
  MessageEmbed, Permissions,
} = require('discord.js');

const {
  games, embedDefaults, constructItemEmbeds, constructTypeEmbeds,
  checkAndMergeEmbeds, chunkFields, timeDeltaToString, emojify,
} = require('../../CommonFunctions.js');
const logger = require('../../Logger');
// eslint-disable-next-line no-unused-vars
const Database = require('../../settings/Database');

const platformChoices = require('../../resources/platformMap.json');
const localeChoices = require('../../resources/localeMap.json');
const { createPagedInteractionCollector } = require('../../CommonFunctions');

const getMentions = (content, guild) => content
  .trim()
  .replace(/[<>@&]/ig, ' ')
  .split(' ')
  .filter(id => id)
  .map(id => guild.roles.cache.get(id.trim()));

const globalable = {
  type: Types.BOOLEAN,
  name: 'global',
  description: 'Should this value be set for every channel in the server?',
};

const custom = [{
  type: Types.SUB_COMMAND,
  name: 'allow_custom',
  description: 'Set allowance of custom commands',
  options: [{
    type: Types.BOOLEAN,
    name: 'value',
    description: 'Should this channel allow custom commands?',
    required: true,
  }, globalable],
}, {
  type: Types.SUB_COMMAND,
  name: 'allow_inline',
  description: 'Set allowance of inline commands',
  options: [{
    type: Types.BOOLEAN,
    name: 'value',
    description: 'Should this channel allow inline commands?',
    required: true,
  }, globalable],
}];
const setLFG = {
  type: Types.SUB_COMMAND,
  name: 'lfg',
  description: 'Set LFG Channel for a Platform',
  options: [{
    type: Types.CHANNEL,
    name: 'channel',
    description: 'Channel to set LFG to post in',
    required: true,
  }, {
    type: Types.STRING,
    name: 'platform',
    description: 'Platform to set channel for',
    required: true,
    choices: platformChoices,
  }],
};
const rooms = [{
  name: 'allow_rooms',
  description: 'Set whether or not to allow custom rooms to be created',
  type: Types.SUB_COMMAND,
  options: [{
    type: Types.BOOLEAN,
    name: 'value',
    description: 'Allow private rooms?',
    required: true,
  }],
}, {
  name: 'auto_locked',
  description: 'Set whether or not to default private rooms to be locked (Default True)',
  type: Types.SUB_COMMAND,
  options: [{
    type: Types.BOOLEAN,
    name: 'value',
    description: 'Lock private rooms?',
    required: true,
  }],
}, {
  name: 'auto_text',
  description: 'Set whether or not to default private rooms to have text channels (Default False)',
  type: Types.SUB_COMMAND,
  options: [{
    type: Types.BOOLEAN,
    name: 'value',
    description: 'Make rooms with text?',
    required: true,
  }],
}, {
  name: 'auto_shown',
  description: 'Set whether or not to default private rooms should be visible (Default false)',
  type: Types.SUB_COMMAND,
  options: [{
    type: Types.BOOLEAN,
    name: 'value',
    description: 'Make rooms visible?',
    required: true,
  }],
}, {
  name: 'temp_category',
  description: 'Set the temporary category for private/auto-generated rooms',
  type: Types.SUB_COMMAND,
  options: [{
    type: Types.CHANNEL,
    name: 'value',
    description: 'Should be a category',
    required: true,
  }],
}, {
  name: 'temp_channel',
  description: 'Set the channel for creating threads in for private rooms',
  type: Types.SUB_COMMAND,
  options: [{
    type: Types.CHANNEL,
    name: 'value',
    description: 'Should be a text channel',
    required: true,
  }],
}];

const settingsCommands = [{
  type: Types.SUB_COMMAND,
  name: 'language',
  description: 'Set a language for the server',
  options: [{
    type: Types.STRING,
    name: 'value',
    description: 'What language do you want to use for this server?',
    choices: localeChoices,
    required: true,
  }],
}, {
  type: Types.SUB_COMMAND,
  name: 'platform',
  description: 'Set the platform for the channel',
  options: [{
    type: Types.STRING,
    name: 'value',
    description: 'What platform is this channel?',
    choices: platformChoices,
    required: true,
  }],
}, {
  type: Types.SUB_COMMAND,
  name: 'ephemerate',
  description: 'Set whether or not messages from slash commands will be public (True by default)',
  options: [{
    type: Types.BOOLEAN,
    name: 'value',
    description: 'Make replies from interactions show in this channel?',
    required: true,
  }],
}, {
  name: 'elevated_roles',
  type: Types.SUB_COMMAND,
  description: 'Set elevated roles',
  options: [{
    name: 'value',
    type: Types.STRING,
    description: 'What roles are elevated?',
    required: true,
  }],
},
...(games.includes('CUST_CMDS')
  ? custom
  : []),
...(games.includes('UTIL')
  ? [setLFG]
  : []),
...(games.includes('ROOMS')
  ? rooms
  : []),
].filter(s => s);

const aliases = {
  allow_inline: 'allowInline',
  allow_custom: 'allowCustom',
  lfg: 'lfgChannel',
  allow_rooms: 'createPrivateChannel',
  auto_locked: 'defaultRoomsLocked',
  auto_text: 'defaultNoText',
  auto_shown: 'defaultShown',
  temp_category: 'tempCategory',
  temp_channel: 'tempChannel',
  elevated_roles: 'elevatedRoles',
};

const negate = '✘';
const affirm = '✓';
const check = emojify('green_tick');
const xmark = emojify('red_tick');
const empty = emojify('empty');

/**
 * Wrap channel value into a string
 * @param {string} val channel id
 * @returns {string|*}
 */
const wrapChannelValue = (val) => {
  if (val !== negate) {
    return `<#${val}>`;
  }
  return val;
};

const wrapRoleValue = (val) => {
  if (val !== negate) {
    return `<@&${val}>`;
  }
  return val;
};

const resolveBoolean = async (channel, setting, settings, db) => {
  if (settings) {
    return settings[setting] === '1' ? affirm : negate;
  }
  return ((await db.getChannelSetting(channel, setting)) === '1' ? affirm : negate);
};

/**
 * Gather settings into one or more embeds
 * @param {CommandContext} ctx context object
 * @param {TextChannel} channel Channel to bind settings from
 * @returns {Promise<Array<MessageEmbed>>}
 */
const gather = async (ctx, channel) => {
  const page = new MessageEmbed(embedDefaults);
  const settings = await ctx.settings.getChannelSettings(channel, [
    'language', 'platform', 'createPrivateChannel', 'allowInline',
    'allowCustom', 'settings.cc.ping', 'defaultRoomsLocked', 'defaultNoText', 'defaultShown',
    'defaultRoles', 'tempCategory', 'lfgChannel', 'lfgChannel.ps4', 'lfgChannel.xb1', 'lfgChannel.swi',
    'modRole', 'ephemerate', 'tempChannel',
  ]);

  page.setTitle('General Settings');
  page.addField('Language', settings.language || ctx.settings.defaults.language, true);
  page.addField('Platform', settings.platform || ctx.settings.defaults.platform, true);
  page.addField('Mod Role', wrapRoleValue(settings.modRole || negate), true);
  page.addField('Allow Inline', await resolveBoolean(channel, 'allowInline', settings), true);
  page.addField('Allow Custom', await resolveBoolean(channel, 'allowCustom', settings), true);
  page.addField('Ping Custom', await resolveBoolean(channel, 'settings.cc.ping', settings), true);
  page.addField('Ephemerate', await resolveBoolean(channel, 'ephemerate', settings), true);

  page.addField('🔽 Private Room Settings 🔽', '_ _', false);
  page.addField('Enabled?', await resolveBoolean(channel, 'createPrivateChannel', settings), true);
  page.addField('Lock?', await resolveBoolean(channel, 'defaultRoomsLocked', settings), true);
  page.addField('No Text?', await resolveBoolean(channel, 'defaultNoText', settings), true);
  page.addField('Hidden?', await resolveBoolean(channel, 'defaultShown', settings), true);

  page.addField('🔽 LFG Settings 🔽', '_ _', false);
  const tempCategory = settings.tempCategory !== '0'
    && typeof settings.tempCategory !== 'undefined'
    ? settings.tempCategory : negate;

  let lfgVal = '';
  if (settings.lfgChannel) {
    lfgVal += `**PC:** ${wrapChannelValue(settings.lfgChannel)}\n`;
  }
  if (settings['lfgChannel.ps4']) {
    lfgVal += `**PS4:** ${wrapChannelValue(settings['lfgChannel.ps4'])}\n`;
  }
  if (settings['lfgChannel.xb1']) {
    lfgVal += `**XB1:** ${wrapChannelValue(settings['lfgChannel.xb1'])}\n`;
  }
  if (settings['lfgChannel.swi']) {
    lfgVal += `**Switch:** ${wrapChannelValue(settings['lfgChannel.swi'])}\n`;
  }
  if (!(settings.lfgChannel || settings['lfgChannel.ps4'] || settings['lfgChannel.xb1'] || settings['lfgChannel.swi'])) {
    lfgVal = negate;
  }
  page.addField('LFG', lfgVal, false);
  page.addField(
    'Temp Channels',
    `Category: ${wrapChannelValue(tempCategory)}\nChannel: ${settings.tempChannel ? wrapChannelValue(settings.tempChannel) : negate}`,
    true,
  );

  const embeds = [page];

  // end of page 1
  const items = await ctx.settings.getTrackedItems(channel);
  const trackedItems = constructItemEmbeds(items);

  const events = await ctx.settings.getTrackedEventTypes(channel);
  const trackedEvents = constructTypeEmbeds(events);
  checkAndMergeEmbeds(embeds, trackedItems);
  checkAndMergeEmbeds(embeds, trackedEvents);

  const stats = await ctx.settings.getGuildStats(channel.guild);
  embeds.push(new MessageEmbed({
    title: ctx.i18n`Most Used Commands`,
    color: 0x444444,
    description: stats
      .filter((s, i) => i < 10)
      .map(s => `\`${s.id.padEnd(25, ' ')} | ${`${s.count}`.padStart(4, ' ')}\``)
      .join('\n'),
  }));
  return embeds;
};

module.exports = class Settings extends require('../../models/Interaction') {
  static elevated = true;
  static enabled = true;
  static command = {
    name: 'settings',
    description: 'Interact with Settings',
    // defaultPermission: false,
    options: [{
      type: Types.SUB_COMMAND_GROUP,
      name: 'set',
      description: 'Set a setting',
      options: settingsCommands,
    }, {
      type: Types.SUB_COMMAND_GROUP,
      name: 'clear',
      description: 'Clear certain settings',
      options: [{
        name: 'pings',
        description: 'Clear tracking pings',
        type: Types.SUB_COMMAND,
      }, {
        name: 'temp_category',
        description: 'Clear temp category for private channels',
        type: Types.SUB_COMMAND,
      }, {
        name: 'all',
        description: 'Clear all settings on the bot for this server',
        type: Types.SUB_COMMAND,
      }],
    }, {
      type: Types.SUB_COMMAND,
      name: 'get',
      description: 'Get all the settings',
    }, {
      name: 'diag',
      type: Types.SUB_COMMAND,
      description: 'Run diagnostics for the guild',
    }],
  };

  static async commandHandler(interaction, ctx) {
    // args
    const { options } = interaction;
    const ephemeral = ctx.ephemerate;

    let action;
    try {
      action = options?.getSubcommandGroup();
    } catch (e) {
      try {
        action = options?.getSubcommand();
      } catch (ex) {
        ctx.logger.error(ex);
        return null;
      }
    }
    let field = options.getSubcommand();
    let value = (options.get?.('value') || options?.get?.('channel'))?.value;
    const platform = options.get?.('platform')?.value;

    // validation
    if (!action) return interaction.reply(ctx.i18n`No action`);
    if (['set', 'clear'].includes(action) && !field) return interaction.reply(ctx.i18n`No field`);

    if (field === 'auto_text') value = !value;

    switch (action) {
      case 'clear':
        switch (field) {
          case 'pings':
            await ctx.settings.removePings(interaction?.guild?.id);
            return interaction.reply({ content: 'pings cleared', ephemeral });
          case 'temp_category':
            await ctx.settings.deleteChannelSetting(interaction.channel, 'tempChannel');
            await ctx.settings.deleteChannelSetting(interaction.channel, 'tempCategory');
            return interaction.reply({ content: 'cleared temp_category', ephemeral });
          case 'all':
            // wipe settings!!!
            await interaction.deferReply({ ephemeral: true });
            // eslint-disable-next-line no-case-declarations
            const { guild } = interaction;
            await ctx.settings.removeGuild(guild.id);
            await Promise
              .all(guild.channels.cache
                .map(channel => this.settings.stopTracking(channel)));
            return interaction.editReply('server-wide purge complete');
          default:
            break;
        }
        break;
      case 'set':
        if (typeof value === 'undefined') return interaction.reply(ctx.i18n`No value`);
        switch (field) {
          case 'lfg':
            field = aliases[field];
            field = platform === 'pc' ? field : `${field}.${platform}`;
          case 'allow_inline':
          case 'allow_custom':
          case 'allow_rooms':
          case 'auto_locked':
          case 'auto_shown':
          case 'auto_text':
          case 'temp_category':
          case 'temp_channel':
            field = aliases[field] || field;
          case 'ephemerate':
          case 'platform':
            await ctx.settings.setChannelSetting(interaction.channel, field, value);
            return interaction.reply(`set ${field} to \`${value}\``);
          case 'elevated_roles':
            field = aliases[field] || field;
            value = getMentions(value, interaction.guild).map(role => role.id).join(',');
            ctx.handler.recalcPerms(value, interaction.guild);
          case 'language':
            await ctx.settings.setGuildSetting(interaction.guild, field, value);
            return interaction.reply({ content: `set ${field} to \`${value}\``, ephemeral });
          default:
            interaction.reply(options?.getSubcommand());
            break;
        }
        logger.info(field);
        break;
      case 'get':
        /* eslint-disable no-case-declarations */
        const pages = await gather(ctx, interaction.channel);
        return createPagedInteractionCollector(interaction, pages, ctx);
      case 'diag':
        const embed = new MessageEmbed();
        embed.setTitle(`Diagnostics for Shard ${interaction.guild.shardId + 1}/${interaction.client.ws.shards.size}`);

        embed.addField('Discord WS', `${check} ${interaction.client.ws.ping.toFixed(2)}ms`, true);

        // check what permissions the bot has in the current channel
        const perms = interaction.channel.permissionsFor(interaction.client.user.id);

        // role management
        const rolePermTokens = [];
        rolePermTokens.push(`${perms.has(Permissions.FLAGS.MANAGE_ROLES) ? check : xmark} Permission Present`);
        rolePermTokens.push(`${empty} Bot role position: ${interaction.guild.me.roles.highest.position}`);

        chunkFields(rolePermTokens, 'Can Manage Roles', '\n')
          .forEach((ef) => {
            embed.addField(ef.name, ef.value, false);
          });

        // Tracking
        const trackingReadinessTokens = [`${perms.has(Permissions.FLAGS.MANAGE_WEBHOOKS) ? `${check}  Can` : `${xmark} Cannot`} Manage Webhooks`];

        const trackables = {
          events: await ctx.settings.getTrackedEventTypes(interaction.channel),
          items: await ctx.settings.getTrackedItems(interaction.channel),
        };
        trackingReadinessTokens.push(trackables.events.length ? `${check} ${trackables.events.length} Events Tracked` : `${xmark} No Events tracked`);
        trackingReadinessTokens.push(trackables.items.length ? `${check} ${trackables.items.length} Items Tracked` : `${xmark} No Items tracked`);

        embed.addField('Trackable Ready', trackingReadinessTokens.join('\n'));

        // General
        embed.addField('General Ids', `Guild: \`${interaction.guild.id}\`\nChannel: \`${interaction.channel.id}\``);

        embed.setTimestamp(new Date());
        embed.setFooter(`Uptime: ${timeDeltaToString(interaction.client.uptime)} `);

        return interaction.reply({ embeds: [embed], ephemeral: ctx.ephemerate });
      default:
        break;
    }
    return interaction.reply({ content: 'not happening', ephemeral });
  }
};
