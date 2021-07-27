'use strict';

const { MessageEmbed } = require('discord.js');

const { timeDeltaToString, games, createGroupedArray, emojify } = require('../CommonFunctions.js');
const logger = require('../Logger');

const platformChoices = require('../resources/platformMap.json');
const localeChoices = require('../resources/localeMap.json');

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
    required: true
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
    required: true
  }, globalable, hideable],
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
].filter(s => s);

module.exports = class Settings extends require('../models/Interaction') {
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
  
  static async commandHandler(interaction, ctx) {
    // args
    const options = interaction.options?.first?.()?.options;
    const ephemeral = typeof options?.get('hidden')?.value !== 'undefined'
      ? options?.get('hidden')?.value
      : true;

    const field = interaction.options?.first()?.name;
    
    const setOptions = options?.first?.()?.options;

    // validation
    if (!field) {
      return interaction.reply(ctx.i18n`No field`);
    }
    
    switch (field) {
      case 'pings':
      case 'permissions':
      case 'set':
        switch (options?.first?.()?.name) {
          case 'platform':
          case 'language':
          case 'allowinline':
          case 'allowcustom':
          default:
            logger.info(options?.first?.()?.name);
            break;
        }
        logger.info(field);
        break;
      default:
        break;
    }
    
    await interaction.defer({ephemeral});
    interaction.editReply({ content: 'got it', ephemeral });
  }
}