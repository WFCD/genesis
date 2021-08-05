'use strict';

const { games } = require('../../CommonFunctions.js');
const logger = require('../../Logger');

const platformChoices = require('../../resources/platformMap.json');
const localeChoices = require('../../resources/localeMap.json');

const hideable = {
  type: 'BOOLEAN',
  name: 'hidden',
  description: 'Should the response be hidden from others?',
};
const globalable = {
  type: 'BOOLEAN',
  name: 'global',
  description: 'Should this value be set for every channel in the server?',
};

const allowCustomCommand = {
  type: 'SUB_COMMAND',
  name: 'allowcustom',
  description: 'Set allowance of custom commands',
  options: [{
    type: 'BOOLEAN',
    name: 'value',
    description: 'Should this channel allow custom commands?',
    required: true,
  }, globalable, hideable],
};
const allowInlineCommand = {
  type: 'SUB_COMMAND',
  name: 'allowinline',
  description: 'Set allowance of inline commands',
  options: [{
    type: 'BOOLEAN',
    name: 'value',
    description: 'Should this channel allow inline commands?',
    required: true,
  }, globalable, hideable],
};
const setLFG = {
  type: 'SUB_COMMAND',
  name: 'lfg',
  description: 'Set LFG Channel for a Platform',
  options: [{
    type: 'CHANNEL',
    name: 'channel',
    description: 'Channel to set LFG to post in',
    required: true,
  }, {
    type: 'STRING',
    name: 'platform',
    description: 'Platform to set channel for',
    required: true,
    choices: platformChoices,
  }],
};

const settingsCommands = [{
  type: 'SUB_COMMAND',
  name: 'language',
  description: 'Set a language for the server',
  options: [{
    type: 'STRING',
    name: 'value',
    description: 'What language do you want to use for this server?',
    choices: localeChoices,
    required: true,
  }, globalable, hideable],
}, {
  type: 'SUB_COMMAND',
  name: 'platform',
  description: 'Set the platform for the channel',
  options: [{
    type: 'STRING',
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

module.exports = class Settings extends require('../../models/Interaction') {
  static elevated = true;
  static command = {
    name: 'settings',
    description: 'Interact with Settings',
    options: [{
      type: 'SUB_COMMAND_GROUP',
      name: 'set',
      description: 'Set a setting',
      options: settingsCommands,
    }, {
      type: 'SUB_COMMAND_GROUP',
      name: 'clear',
      description: 'Clear certain settings',
      options: [{
        name: 'permissions',
        description: 'Clear command usage permissions',
        type: 'SUB_COMMAND',
      }, {
        name: 'pings',
        description: 'Clear tracking pings',
        type: 'SUB_COMMAND',
      }],
    }],
  };

  /**
   * Handle the copmmand interaction
   * @param {CommandInteraction} interaction interaction to handle
   * @param {Object} ctx interaction context
   * @returns {Promise<Message|APIMessage|*>}
   */
  static async commandHandler(interaction, ctx) {
    // args
    const options = interaction.options.first();
    const ephemeral = typeof options?.get?.('hidden')?.value !== 'undefined'
      ? options?.get('hidden')?.value
      : true;

    const action = options.name;
    let field = options.options?.first?.()?.name;
    const valOpt = options?.options?.first?.()?.options;
    const value = valOpt?.get?.('value')?.value || valOpt?.get?.('channel')?.value;
    const platform = options?.options?.first?.()?.options?.get?.('platform')?.value;

    // validation
    if (!action) return interaction.reply(ctx.i18n`No action`);
    if (!field) return interaction.reply(ctx.i18n`No field`);
    if (!value) return interaction.reply(ctx.i18n`No value`);

    switch (action) {
      case 'pings':
      case 'permissions':
      case 'set':
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
          default:
            logger.info(options?.first?.()?.name);
            break;
        }
        logger.info(field);
        break;
      default:
        break;
    }

    await interaction.defer({ ephemeral });
    return interaction.editReply({ content: 'not happening', ephemeral });
  }
};
