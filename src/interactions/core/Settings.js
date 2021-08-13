'use strict';

const {
  // eslint-disable-next-line no-unused-vars
  Constants: { ApplicationCommandOptionTypes: Types }, MessageEmbed, CommandInteraction,
} = require('discord.js');

const {
  games, embedDefaults, constructItemEmbeds, constructTypeEmbeds, checkAndMergeEmbeds,
} = require('../../CommonFunctions.js');
const logger = require('../../Logger');
// eslint-disable-next-line no-unused-vars
const Database = require('../../settings/Database');

const platformChoices = require('../../resources/platformMap.json');
const localeChoices = require('../../resources/localeMap.json');
const { createGroupedArray } = require('../../CommonFunctions');

const hideable = {
  type: Types.BOOLEAN,
  name: 'hidden',
  description: 'Should the response be hidden from others?',
};
const globalable = {
  type: Types.BOOLEAN,
  name: 'global',
  description: 'Should this value be set for every channel in the server?',
};

const allowCustomCommand = {
  type: Types.SUB_COMMAND,
  name: 'allowcustom',
  description: 'Set allowance of custom commands',
  options: [{
    type: Types.BOOLEAN,
    name: 'value',
    description: 'Should this channel allow custom commands?',
    required: true,
  }, globalable, hideable],
};
const allowInlineCommand = {
  type: Types.SUB_COMMAND,
  name: 'allowinline',
  description: 'Set allowance of inline commands',
  options: [{
    type: Types.BOOLEAN,
    name: 'value',
    description: 'Should this channel allow inline commands?',
    required: true,
  }, globalable, hideable],
};
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
  }, globalable, hideable],
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
  }, globalable, hideable],
},
...(games.includes('CUST_CMDS')
  ? [allowCustomCommand, allowInlineCommand]
  : []),
...(games.includes('UTIL')
  ? [setLFG]
  : []),
].filter(s => s);

const aliases = {
  allowinline: 'allowInline',
  allowcustom: 'allowCustom',
  lfg: 'lfgChannel',
};

const negate = '✘';
const affirm = '✓';

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
 * @param {Database} db database interface
 * @param {Channel} channel Channel to bind settings from
 * @returns {Promise<Array<MessageEmbed>>}
 */
const gather = async (db, channel) => {
  const page = new MessageEmbed(embedDefaults);
  const settings = await db.getChannelSettings(channel, [
    'language', 'platform', 'prefix', 'createPrivateChannel', 'deleteExpired', 'allowInline',
    'allowCustom', 'settings.cc.ping', 'defaultRoomsLocked', 'defaultNoText', 'defaultShown',
    'respond_to_settings', 'respond_to_settings', 'delete_after_respond', 'delete_response',
    'defaultRoles', 'tempCategory', 'lfgChannel', 'lfgChannel.ps4', 'lfgChannel.xb1', 'lfgChannel.swi',
    'vulgarLog', 'msgDeleteLog', 'memberRemoveLog', 'banLog', 'unbanLog', 'modRole',
  ]);

  page.setTitle('General Settings');
  page.addField('Language', settings.language || db.defaults.language, true);
  page.addField('Platform', settings.platform || db.defaults.platform, true);
  page.addField('Mod Role', wrapRoleValue(settings.modRole || negate), true);
  page.addField('Allow Inline', await resolveBoolean(channel, 'allowInline', settings), true);
  page.addField('Allow Custom', await resolveBoolean(channel, 'allowCustom', settings), true);
  page.addField('Ping Custom', await resolveBoolean(channel, 'settings.cc.ping', settings), true);

  page.addField('🔽 Private Room Settings 🔽', '_ _', false);
  page.addField('Private Room', await resolveBoolean(channel, 'createPrivateChannel', settings), true);
  page.addField('Locked Channel', await resolveBoolean(channel, 'defaultRoomsLocked', settings), true);
  page.addField('No Text Channel', await resolveBoolean(channel, 'defaultNoText', settings), true);
  page.addField('Hidden Channel', await resolveBoolean(channel, 'defaultShown', settings), true);

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
  page.addField('Temp Channel Category', wrapChannelValue(tempCategory), true);

  const embeds = [page];

  // end of page 1
  const items = await db.getTrackedItems(channel);
  const trackedItems = constructItemEmbeds(items);

  const events = await db.getTrackedEventTypes(channel);
  const trackedEvents = constructTypeEmbeds(events);
  checkAndMergeEmbeds(embeds, trackedItems);
  checkAndMergeEmbeds(embeds, trackedEvents);
  return embeds;
};

module.exports = class Settings extends require('../../models/Interaction') {
  static elevated = true;
  static command = {
    name: 'settings',
    description: 'Interact with Settings',
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
      }],
    }, {
      type: Types.SUB_COMMAND,
      name: 'get',
      description: 'Get all the settings',
    }],
  };

  /**
   * Handle the copmmand interaction
   * @param {CommandInteraction} interaction interaction to handle
   * @param {Object} ctx interaction context
   */
  static async commandHandler(interaction, ctx) {
    // args
    const { options } = interaction;
    const ephemeral = typeof options?.get?.('hidden')?.value !== 'undefined'
      ? options?.get('hidden')?.value
      : true;

    const action = options.getSubcommandGroup();
    let field = options.getSubcommand();
    const value = options.get?.('value') || options?.get?.('channel');
    const platform = options.get?.('platform')?.value;

    // validation
    if (!action) return interaction.reply(ctx.i18n`No action`);
    if (['set', 'clear'].includes(action) && !field) return interaction.reply(ctx.i18n`No field`);

    switch (action) {
      case 'clear':
        switch (field) {
          case 'pings':
            await ctx.settings.removePings(interaction?.guild?.id);
            return interaction.reply({ content: 'pings cleared', ephemeral });
          default:
            break;
        }
        break;
      case 'set':
        if (!value) return interaction.reply(ctx.i18n`No value`);
        switch (field) {
          case 'lfg':
            field = aliases[field];
            field = platform === 'pc' ? field : `${field}.${platform}`;
          case 'allowinline':
          case 'allowcustom':
            field = aliases[field] || field;
          case 'platform':
            await ctx.settings.setChannelSetting(ctx.channel, field, value);
            return interaction.reply({ content: `set ${field} to ${value}`, ephemeral });
          case 'language':
            await ctx.settings.setGuildSetting(interaction.guild, field, value);
            return interaction.reply({ content: `set ${field} to ${value}`, ephemeral });
          case 'createprivate':
          case 'defaultlocked':
          case 'defaultshown':
          default:
            logger.info(options?.first?.()?.name);
            break;
        }
        logger.info(field);
        break;
      case 'get':
        /* eslint-disable no-case-declarations */
        const pages = (await gather(ctx.settings, interaction.channel));
        const pageGroups = createGroupedArray(pages, 10);
        let first = true;
        for (const pageGroup of pageGroups) {
          // ctx.logger.info(JSON.stringify(pageGroup));
          if (first) {
            interaction.reply({
              embeds: pageGroup.map(p => new MessageEmbed(p)),
              ephemeral,
            });
            first = false;
          } else interaction.followUp({ embeds: pageGroup, ephemeral });
        }
        return null;
      default:
        break;
    }

    await interaction.deferReply({ ephemeral });
    return interaction.editReply({ content: 'not happening', ephemeral });
  }
};
