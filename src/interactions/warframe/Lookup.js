'use strict';

const Discord = require('discord.js');

const { games } = require('../../CommonFunctions.js');
const { ENDPOINTS } = require('../../resources/WorldStateClient');

const { Constants: { ApplicationCommandOptionTypes: Types } } = Discord;
const queryOpt = [{
  type: Types.STRING,
  name: 'query',
  description: 'Thing to search up',
  required: true,
}];

const embeds = {
  Arcane: require('../../embeds/EnhancementEmbed'),
  Weapon: require('../../embeds/WeaponEmbed'),
  Warframe: require('../../embeds/FrameEmbed'),
  Mod: require('../../embeds/ModEmbed'),
  Riven: require('../../embeds/RivenStatEmbed'),
};

module.exports = class Lookup extends require('../../models/Interaction') {
  static enabled = games.includes('WARFRAME');

  static command = {
    name: 'lookup',
    description: 'Get various pieces of information',
    options: [{
      type: Types.SUB_COMMAND,
      name: 'arcane',
      description: 'Look up an Arcane from Warframe',
      options: queryOpt,
    }, {
      type: Types.SUB_COMMAND,
      name: 'warframe',
      description: 'Look up a Warframe',
      options: queryOpt,
    }, {
      type: Types.SUB_COMMAND,
      name: 'weapon',
      description: 'Look up a weapon',
      options: queryOpt,
    }, {
      type: Types.SUB_COMMAND,
      name: 'riven',
      description: 'Look up a Riven',
      options: queryOpt,
    }, {
      type: Types.SUB_COMMAND,
      name: 'mod',
      description: 'Look up a Mod',
      options: queryOpt,
    }],
  };

  /**
   * Handle a discord interaction
   * @param {Discord.CommandInteraction} interaction interaction to handle
   * @param {Object} ctx context object
   * @returns {Promise<*>}
   */
  static async commandHandler(interaction, ctx) {
    // args
    const subcommand = interaction.options.first();
    const options = subcommand?.options;
    const query = options.get('query').value;
    let data;
    let embed;

    /* eslint-disable no-case-declarations */
    switch (subcommand.name) {
      case 'arcane':
        await interaction.deferReply({ ephemeral: true });
        data = await ctx.ws.search(ENDPOINTS.SEARCH.ARCANES, query);
        if (!data.length) return interaction.editReply({ content: 'None found' });
        embed = new embeds.Arcane(null, data[0], ctx.i18n);
        break;
      case 'weapon':
        await interaction.deferReply({ ephemeral: true });
        data = await ctx.ws.search(ENDPOINTS.SEARCH.WEAPONS, query);
        if (!data.length) return interaction.editReply({ content: 'None found' });
        embed = new embeds.Weapon(null, data[0], ctx.i18n);
        break;
      case 'warframe':
        await interaction.deferReply({ ephemeral: true });
        data = await ctx.ws.search(ENDPOINTS.SEARCH.WARFRAMES, query);
        if (!data.length) return interaction.editReply({ content: 'None found' });
        embed = new embeds.Warframe(null, data[0], ctx.i18n);
        break;
      case 'riven':
        await interaction.deferReply({ ephemeral: true });
        data = await ctx.ws.riven(query, ctx.platform);
        if (!data.length) return interaction.editReply({ content: 'None found' });
        embed = new embeds.Riven(null, data[Object.keys(data)[0]], ctx.i18n);
        break;
      case 'mod':
        await interaction.deferReply({ ephemeral: true });
        data = (await ctx.ws.search(ENDPOINTS.SEARCH.ITEMS, query))
          .filter(m => typeof m.baseDrain !== 'undefined');
        if (!data.length) return interaction.editReply({ content: 'None found' });
        embed = new embeds.Mod(null, data[0], ctx.i18n);
        break;
      default:
        return interaction.reply('ok');
    }
    return interaction.editReply({ embeds: [embed] });
  }
};
