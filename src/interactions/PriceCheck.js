'use strict';

const { ApplicationCommand, MessageEmbed } = require('discord.js');

const { timeDeltaToString, games, emojify } = require('../CommonFunctions.js');
const platformChoices = require('../resources/platformMap.json');

module.exports = class PriceCheck extends require('../models/Interaction') {
  static enabled = true;

  static command = {
    name: 'pricecheck',
    description: 'Price check an item',
    options: [{
      type: 'STRING',
      name: 'query',
      description: 'What do you wat to search for?',
      required: true,
    }, {
      type: 'STRING',
      name: 'platform',
      description: 'Platform to check for data',
      choices: platformChoices,
    }],
  };
  
  static async commandHandler(interaction, ctx) {
    const options = interaction.options;
    const platform = options?.get('platform')?.value || ctx.platform || 'pc';
    const query = options?.get('query')?.value;
    
    interaction.defer({ ephemeral: true });
    const embeds = await ctx.ws.pricecheck(query, { platform });
    interaction.editReply({ embeds });
  }
}