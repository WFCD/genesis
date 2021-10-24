'use strict';

const { Constants: { ApplicationCommandOptionTypes: Types } } = require('discord.js');
const platformChoices = require('../../resources/platformMap.json');

module.exports = class PriceCheck extends require('../../models/Interaction') {
  static enabled = true;

  static command = {
    name: 'pc',
    description: 'Price check an item',
    options: [{
      type: Types.STRING,
      name: 'query',
      description: 'What do you wat to search for?',
      required: true,
    }, {
      type: Types.STRING,
      name: 'platform',
      description: 'Platform to check for data',
      choices: platformChoices,
    }],
  };

  static async commandHandler(interaction, ctx) {
    const { options } = interaction;
    const platform = options?.get('platform')?.value || ctx.platform || 'pc';
    const query = options?.get('query')?.value;

    await interaction.deferReply({ ephemeral: ctx.ephemerate });
    const embeds = await ctx.ws.pricecheck(query, { platform });
    return interaction.editReply({ embeds, ephemeral: ctx.ephemerate });
  }
};
