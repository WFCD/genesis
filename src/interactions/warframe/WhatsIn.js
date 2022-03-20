'use strict';

const Discord = require('discord.js');

const { games } = require('../../CommonFunctions.js');

const { Constants: { ApplicationCommandOptionTypes: Types } } = Discord;
const queryOpt = [{
  type: Types.STRING,
  name: 'query',
  description: 'Relic Identifier (i.e. A1)',
  required: true,
}];

const WhatsInEmbed = require('../../embeds/WhatsinEmbed');
const { toTitleCase } = require('../../CommonFunctions');

module.exports = class WhatsIn extends require('../../models/Interaction') {
  static enabled = games.includes('WARFRAME');

  /**
   * @type {Discord.ApplicationCommandData}
   */
  static command = {
    name: 'whatsin',
    description: 'Get various pieces of information',
    options: [{
      name: 'relic_era',
      type: Types.STRING,
      description: 'What relic tier is the relic from?',
      required: true,
      choices: [{
        name: 'Lith',
        value: 'lith',
      }, {
        name: 'Neo',
        value: 'neo',
      }, {
        name: 'Meso',
        value: 'meso',
      }, {
        name: 'Axi',
        value: 'axi',
      }, {
        name: 'Requiem',
        value: 'requiem',
      }],
    }, ...queryOpt],
  };

  /**
   * Handle a discord interaction
   * @param {Discord.CommandInteraction} interaction interaction to handle
   * @param {CommandContext} ctx context object
   * @returns {Promise<*>}
   */
  static async commandHandler(interaction, ctx) {
    // args
    const tier = toTitleCase(interaction.options.get('relic_era').value);
    const query = toTitleCase(interaction.options.get('query').value);
    const data = await ctx.ws.relic(tier, tier.toLowerCase() === 'requiem' ? query.toUpperCase() : query);
    if (!data || !Object.keys(data).length) return interaction.reply('Sorry, no such relic');
    const embed = new WhatsInEmbed(data, tier, query);
    return interaction.reply({ embeds: [embed], ephemeral: ctx.ephemerate });
  }
};
