import { ApplicationCommandOptionType as Types } from 'discord.js';

import WorldStateClient from '#shared/utilities/WorldStateClient';
import Collectors from '#shared/utilities/Collectors';
import Arcane from '#shared/embeds/EnhancementEmbed';
import Weapon from '#shared/embeds/WeaponEmbed';
import Riven from '#shared/embeds/RivenStatEmbed';
import Component from '#shared/embeds/ComponentEmbed';
import Patchnote from '#shared/embeds/PatchnotesEmbed';
import Warframe from '#shared/embeds/FrameEmbed';
import Mod from '#shared/embeds/ModEmbed';
import { createGroupedArray, games, withEphemeral } from '#shared/utilities/CommonFunctions';
import { cmds } from '#shared/resources/index';
import CompanionEmbed from '#shared/embeds/CompanionEmbed';

import Interaction from '../../models/Interaction';

const { ENDPOINTS } = WorldStateClient;
const queryOpt = [
  {
    ...cmds.query,
    type: Types.String,
    required: true,
  },
];
const patchnotes = {
  ...cmds.patchnotes,
  type: Types.Boolean,
  required: false,
};
const companionTypes = ['Pets', 'Sentinel'];

export default class Lookup extends Interaction {
  static enabled = games.includes('WARFRAME');

  static command = {
    ...cmds.lookup,
    options: [
      {
        ...cmds.arcane,
        type: Types.Subcommand,
        options: queryOpt,
      },
      {
        ...cmds.warframe,
        type: Types.Subcommand,
        options: [...queryOpt, patchnotes],
      },
      {
        ...cmds.weapon,
        type: Types.Subcommand,
        options: [...queryOpt, patchnotes],
      },
      {
        ...cmds.riven,
        type: Types.Subcommand,

        options: queryOpt,
      },
      {
        ...cmds.mod,
        type: Types.Subcommand,
        options: [...queryOpt, patchnotes],
      },
      {
        ...cmds.companion,
        type: Types.Subcommand,
        options: [...queryOpt, patchnotes],
      },
    ],
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
    const enablePatchnotes =
      typeof options.getBoolean('patchnotes') === 'undefined' ? false : options.getBoolean('patchnotes');
    let data;
    let pages = [];

    await interaction.deferReply(withEphemeral(ctx.ephemerate));
    switch (subcommand) {
      case 'arcane':
        data = await ctx.ws.search(ENDPOINTS.SEARCH.ARCANES, query);
        if (!data.length) return interaction.editReply('None found');
        pages = data.map((d) => new Arcane(d, { i18n: ctx.i18n }));
        return Collectors.dynamic(interaction, pages, ctx);
      case 'weapon':
        data = ctx.ws.weapon(query);
        if (!data.length) return interaction.editReply('None found');
        await Promise.all(
          data.map(async (weapon) => {
            pages.push(new Weapon(weapon, { i18n: ctx.i18n }));
            const strippedWeaponN = query.replace(/(prime|vandal|wraith|prisma)/gi, '').trim();
            const rivenResults = await ctx.ws.riven(strippedWeaponN, ctx.platform);
            if (Object.keys(rivenResults).length > 0) {
              const strippedRes = weapon.name.replace(/(prime|vandal|wraith|prisma)/gi, '').trim();
              if (rivenResults[strippedRes]) {
                pages.push(new Riven(rivenResults[strippedRes], { resultKey: weapon.name, i18n: ctx.i18n }));
              }
            }

            if (weapon?.components?.length) {
              pages.push(new Component(weapon.components, { i18n: ctx.i18n }));
            }

            if (weapon?.patchlogs?.length && enablePatchnotes) {
              createGroupedArray(weapon.patchlogs, 4).forEach((patchGroup) =>
                pages.push(new Patchnote(patchGroup, { i18n: ctx.i18n }))
              );
            }
          })
        );
        return Collectors.dynamic(interaction, pages, ctx);
      case 'warframe':
        data = ctx.ws.warframe(query);
        if (!data.length) return interaction.editReply('None found');
        await Promise.all(
          data.map(async (warframe) => {
            pages.push(new Warframe(warframe, { i18n: ctx.i18n }));
            if (warframe?.components?.length) {
              pages.push(new Component(warframe.components, { i18n: ctx.i18n }));
            }
            if (warframe?.patchlogs?.length && enablePatchnotes) {
              createGroupedArray(warframe?.patchlogs, 4).forEach((patchGroup) => {
                pages.push(new Patchnote(patchGroup, { i18n: ctx.i18n }));
              });
            }
          })
        );
        return Collectors.dynamic(interaction, pages, ctx);
      case 'riven':
        data = await ctx.ws.riven(query, ctx.platform);
        if (!Object.keys(data).length) return interaction.editReply('None found');
        pages = Object.keys(data).map((d) => new Riven(data[d], { resultKey: d, i18n: ctx.i18n }));
        return Collectors.dynamic(interaction, pages, ctx);
      case 'mod':
        data = ctx.ws.mod(query).filter((m) => typeof m.baseDrain !== 'undefined');
        if (!data.length) return interaction.editReply('None found');
        data.forEach((mod) => {
          pages.push(new Mod(mod, { i18n: ctx.i18n }));
          if (mod?.patchlogs?.length && enablePatchnotes) {
            createGroupedArray(mod?.patchlogs, 4).forEach((patchGroup) => {
              pages.push(new Patchnote(patchGroup, { i18n: ctx.i18n }));
            });
          }
        });
        pages = Object.keys(data).map((d) => new Mod(data[d], { i18n: ctx.i18n }));
        return Collectors.dynamic(interaction, pages, ctx);
      case 'companion':
        data = (await ctx.ws.search(ENDPOINTS.SEARCH.ITEMS, query)).filter((c) => companionTypes.includes(c.type));
        if (!data.length) return interaction.editReply('None found');
        data.forEach((companion) => {
          pages.push(new CompanionEmbed(companion, { i18n: ctx.i18n }));
          // TODO: get companion precepts added to item data
          if (companion.precepts) {
            companion.precepts.forEach((precept) => pages.push(new Mod(precept, { i18n: ctx.i18n })));
          }
          createGroupedArray(companion?.patchlogs, 4).forEach((patchGroup) => {
            pages.push(new Patchnote(patchGroup, { i18n: ctx.i18n }));
          });
        });
        return Collectors.dynamic(interaction, pages, ctx);
      default:
        return interaction.editReply('ok');
    }
  }
}
