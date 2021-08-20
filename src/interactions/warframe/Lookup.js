'use strict';

const Discord = require('discord.js');

const {
  games, createPagedInteractionCollector, createSelectionCollector, createGroupedArray,
} = require('../../CommonFunctions.js');
const { ENDPOINTS } = require('../../resources/WorldStateClient');

const { Constants: { ApplicationCommandOptionTypes: Types } } = Discord;
const queryOpt = [{
  type: Types.STRING,
  name: 'query',
  description: 'Thing to search up',
  required: true,
}];
const patchnotes = {
  type: Types.BOOLEAN,
  name: 'patchnotes',
  description: 'Include patchnotes? (default false)',
  required: false,
};

const embeds = {
  Arcane: require('../../embeds/EnhancementEmbed'),
  Weapon: require('../../embeds/WeaponEmbed'),
  Warframe: require('../../embeds/FrameEmbed'),
  Mod: require('../../embeds/ModEmbed'),
  Riven: require('../../embeds/RivenStatEmbed'),
  Component: require('../../embeds/ComponentEmbed.js'),
  Patchnote: require('../../embeds/PatchnotesEmbed.js'),
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
      options: [...queryOpt, patchnotes],
    }, {
      type: Types.SUB_COMMAND,
      name: 'weapon',
      description: 'Look up a weapon',
      options: [...queryOpt, patchnotes],
    }, {
      type: Types.SUB_COMMAND,
      name: 'riven',
      description: 'Look up a Riven',
      options: queryOpt,
    }, {
      type: Types.SUB_COMMAND,
      name: 'mod',
      description: 'Look up a Mod',
      options: [...queryOpt, patchnotes],
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
    const subcommand = interaction.options.getSubcommand();
    const { options } = interaction;
    const query = options.get('query').value;
    const enablePatchnotes = typeof options.getBoolean('patchnotes') === 'undefined'
      ? false
      : options.getBoolean('patchnotes');
    let data;
    let pages = [];

    switch (subcommand) {
      case 'arcane':
        await interaction.deferReply({ ephemeral: ctx.ephemerate });
        data = await ctx.ws.search(ENDPOINTS.SEARCH.ARCANES, query);
        if (!data.length) return interaction.editReply('None found');
        pages = data.map(d => new embeds.Arcane(null, d, ctx.i18n));
        return pages.length < 25
          ? createSelectionCollector(interaction, pages, ctx)
          : createPagedInteractionCollector(interaction, pages, ctx);
      case 'weapon':
        await interaction.deferReply({ ephemeral: ctx.ephemerate });
        data = await ctx.ws.search(ENDPOINTS.SEARCH.WEAPONS, query);
        if (!data.length) return interaction.editReply('None found');
        for (const weapon of data) {
          pages.push(new embeds.Weapon(null, weapon, ctx.i18n));
          const strippedWeaponN = query.replace(/(prime|vandal|wraith|prisma)/ig, '').trim();
          const rivenResults = await ctx.ws.riven(strippedWeaponN, ctx.platform);
          if (Object.keys(rivenResults).length > 0) {
            const strippedRes = weapon.name.replace(/(prime|vandal|wraith|prisma)/ig, '').trim();
            if (rivenResults[strippedRes]) {
              pages
                .push(new embeds.Riven(null, rivenResults[strippedRes], weapon.name, ctx.i18n));
            }
          }

          if (weapon?.components?.length) pages.push(new embeds.Component(null, weapon.components));

          if (weapon?.patchlogs?.length && enablePatchnotes) {
            createGroupedArray(weapon.patchlogs, 4)
              // eslint-disable-next-line no-loop-func
              .forEach(patchGroup => pages.push(new embeds.Patchnote(null, patchGroup)));
          }
        }
        return pages.length < 25
          ? createSelectionCollector(interaction, pages, ctx)
          : createPagedInteractionCollector(interaction, pages, ctx);
      case 'warframe':
        await interaction.deferReply({ ephemeral: ctx.ephemerate });
        data = await ctx.ws.search(ENDPOINTS.SEARCH.WARFRAMES, query);
        if (!data.length) return interaction.editReply('None found');
        for (const warframe of data) {
          pages.push(new embeds.Warframe(null, warframe, ctx.i18n));
          if (warframe?.components?.length) {
            pages.push(new embeds.Component(null, warframe.components));
          }
          if (warframe?.patchlogs?.length && enablePatchnotes) {
            // eslint-disable-next-line no-loop-func
            createGroupedArray(warframe?.patchlogs, 4).forEach((patchGroup) => {
              pages.push(new embeds.Patchnote(null, patchGroup));
            });
          }
        }
        return pages.length < 25
          ? createSelectionCollector(interaction, pages, ctx)
          : createPagedInteractionCollector(interaction, pages, ctx);
      case 'riven':
        await interaction.deferReply({ ephemeral: ctx.ephemerate });
        data = await ctx.ws.riven(query, ctx.platform);
        if (!Object.keys(data).length) return interaction.editReply('None found');
        pages = Object.keys(data).map(d => new embeds.Riven(null, data[d], d, ctx.i18n));
        return pages.length < 25
          ? createSelectionCollector(interaction, pages, ctx)
          : createPagedInteractionCollector(interaction, pages, ctx);
      case 'mod':
        await interaction.deferReply({ ephemeral: ctx.ephemerate });
        data = (await ctx.ws.search(ENDPOINTS.SEARCH.ITEMS, query))
          .filter(m => typeof m.baseDrain !== 'undefined');
        if (!data.length) return interaction.editReply('None found');
        for (const mod of data) {
          pages.push(new embeds.Mod(null, mod, ctx.i18n));
          if (mod?.patchlogs?.length && enablePatchnotes) {
            // eslint-disable-next-line no-loop-func
            createGroupedArray(mod?.patchlogs, 4).forEach((patchGroup) => {
              pages.push(new embeds.Patchnote(null, patchGroup));
            });
          }
        }
        pages = Object.keys(data).map(d => new embeds.Mod(null, data[d], ctx.i18n));
        return pages.length < 25
          ? createSelectionCollector(interaction, pages, ctx)
          : createPagedInteractionCollector(interaction, pages, ctx);
      default:
        return interaction.reply('ok');
    }
  }
};
