import { ApplicationCommandOptionType } from 'discord.js';

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
import { cmds } from '../../resources/index.js';
import CompanionEmbed from '../../embeds/CompanionEmbed.js';

const { ENDPOINTS } = WorldStateClient;

const queryOpt = [
  {
    ...cmds.query,
    type: ApplicationCommandOptionType.String,
    required: true,
  },
];
const patchnotes = {
  ...cmds.patchnotes,
  type: ApplicationCommandOptionType.Boolean,
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
        type: ApplicationCommandOptionType.Subcommand,
        options: queryOpt,
      },
      {
        ...cmds.warframe,
        type: ApplicationCommandOptionType.Subcommand,
        options: [...queryOpt, patchnotes],
      },
      {
        ...cmds.weapon,
        type: ApplicationCommandOptionType.Subcommand,
        options: [...queryOpt, patchnotes],
      },
      {
        ...cmds.riven,
        type: ApplicationCommandOptionType.Subcommand,

        options: queryOpt,
      },
      {
        ...cmds.mod,
        type: ApplicationCommandOptionType.Subcommand,
        options: [...queryOpt, patchnotes],
      },
      {
        ...cmds.companion,
        type: ApplicationCommandOptionType.Subcommand,
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

    await interaction.deferReply({ flags: ctx.ephemerate ? this.MessageFlags.Ephemeral : 0 });
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
              createGroupedArray(weapon.patchlogs, 4)
                // eslint-disable-next-line no-loop-func
                .forEach((patchGroup) => pages.push(new Patchnote(patchGroup)));
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
              // eslint-disable-next-line no-loop-func
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
            // eslint-disable-next-line no-loop-func
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
