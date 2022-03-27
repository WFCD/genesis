import Discord from 'discord.js';
import WorldStateClient from '../../utilities/WorldStateClient.js';
import Interaction from '../../models/Interaction.js';
import Collectors from '../../utilities/Collectors.js';
import Arcane from '../../embeds/EnhancementEmbed.js';
import Weapon from '../../embeds/WeaponEmbed.js';
import Riven from '../../embeds/RivenStatEmbed.js';
import Component from '../../embeds/ComponentEmbed.js';
import Patchnote from '../../embeds/PatchnotesEmbed.js';
import Warframe from '../../embeds/FrameEmbed.js';
import Mod from '../../embeds/ModEmbed.js';

import { createGroupedArray, games } from '../../utilities/CommonFunctions.js';

const { ENDPOINTS } = WorldStateClient;

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

export default class Lookup extends Interaction {
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
        pages = data.map(d => new Arcane(d, { i18n: ctx.i18n }));
        return Collectors.dynamic(interaction, pages, ctx);
      case 'weapon':
        await interaction.deferReply({ ephemeral: ctx.ephemerate });
        data = await ctx.ws.search(ENDPOINTS.SEARCH.WEAPONS, query);
        if (!data.length) return interaction.editReply('None found');
        await Promise.all(data.map(async (weapon) => {
          pages.push(new Weapon(weapon, { i18n: ctx.i18n }));
          const strippedWeaponN = query.replace(/(prime|vandal|wraith|prisma)/ig, '').trim();
          const rivenResults = await ctx.ws.riven(strippedWeaponN, ctx.platform);
          if (Object.keys(rivenResults).length > 0) {
            const strippedRes = weapon.name.replace(/(prime|vandal|wraith|prisma)/ig, '').trim();
            if (rivenResults[strippedRes]) {
              pages.push(
                new Riven(rivenResults[strippedRes], { resultKey: weapon.name, i18n: ctx.i18n }),
              );
            }
          }

          if (weapon?.components?.length) {
            pages.push(new Component(weapon.components, { i18n: ctx.i18n }));
          }

          if (weapon?.patchlogs?.length && enablePatchnotes) {
            createGroupedArray(weapon.patchlogs, 4)
              // eslint-disable-next-line no-loop-func
              .forEach(patchGroup => pages.push(new Patchnote(patchGroup)));
          }
        }));
        return Collectors.dynamic(interaction, pages, ctx);
      case 'warframe':
        await interaction.deferReply({ ephemeral: ctx.ephemerate });
        data = await ctx.ws.search(ENDPOINTS.SEARCH.WARFRAMES, query);
        if (!data.length) return interaction.editReply('None found');
        await Promise.all(data.map(async (warframe) => {
          pages.push(new Warframe(warframe, { i18n: ctx.i18n }));
          if (warframe?.components?.length) {
            pages.push(new Component(warframe.components, { i18n: ctx.i18n }));
          }
          if (warframe?.patchlogs?.length && enablePatchnotes) {
            // eslint-disable-next-line no-loop-func
            createGroupedArray(warframe?.patchlogs, 4).forEach((patchGroup) => {
              pages.push(new Patchnote(patchGroup, { i18n: ctx.i18n }));
            });
          }
        }));
        return Collectors.dynamic(interaction, pages, ctx);
      case 'riven':
        await interaction.deferReply({ ephemeral: ctx.ephemerate });
        data = await ctx.ws.riven(query, ctx.platform);
        if (!Object.keys(data).length) return interaction.editReply('None found');
        pages = Object.keys(data).map(d => new Riven(data[d], { resultKey: d, i18n: ctx.i18n }));
        return Collectors.dynamic(interaction, pages, ctx);
      case 'mod':
        await interaction.deferReply({ ephemeral: ctx.ephemerate });
        data = (await ctx.ws.search(ENDPOINTS.SEARCH.ITEMS, query))
          .filter(m => typeof m.baseDrain !== 'undefined');
        if (!data.length) return interaction.editReply('None found');
        await Promise.all(data.map(async (mod) => {
          pages.push(new Mod(mod, { i18n: ctx.i18n }));
          if (mod?.patchlogs?.length && enablePatchnotes) {
            // eslint-disable-next-line no-loop-func
            createGroupedArray(mod?.patchlogs, 4).forEach((patchGroup) => {
              pages.push(new Patchnote(patchGroup, { i18n: ctx.i18n }));
            });
          }
        }));
        pages = Object.keys(data).map(d => new Mod(data[d], { i18n: ctx.i18n }));
        return Collectors.dynamic(interaction, pages, ctx);
      default:
        return interaction.reply('ok');
    }
  }
}
