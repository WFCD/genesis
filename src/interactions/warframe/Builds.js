import {
  ActionRow,
  StringSelectMenuBuilder,
  InteractionCollector,
  ButtonBuilder,
  EmbedBuilder,
  ApplicationCommandOptionType,
  InteractionType,
  ComponentType,
  ButtonStyle,
} from 'discord.js';

import Build from '../../models/Build.js';
import BuildEmbed from '../../embeds/BuildEmbed.js';
import FrameEmbed from '../../embeds/FrameEmbed.js';
import WeaponEmbed from '../../embeds/WeaponEmbed.js';
import Collectors from '../../utilities/Collectors.js';
import Interaction from '../../models/Interaction.js';
import { createGroupedArray, games } from '../../utilities/CommonFunctions.js';

const buildParts = [
  {
    name: 'title',
    description: 'What do you want to call it?',
    required: true,
  },
  {
    name: 'warframe',
    description: 'Which Warframe?',
    required: true,
    compat: ['Warframe Mod'],
    moddable: true,
    display: 'Warframe',
    max: 10,
  },
  {
    name: 'primus',
    description: 'Which Primary?',
    compat: ['Rifle Mod', 'Shotgun Mod'],
    moddable: true,
    display: 'Primary',
    max: 9,
  },
  {
    name: 'secondary',
    description: 'Which Secondary?',
    compat: ['Secondary Mod'],
    moddable: true,
    display: 'Secondary',
    max: 9,
  },
  {
    name: 'melee',
    description: 'Which melee weapon?',
    compat: ['Melee Mod'],
    moddable: true,
    display: 'Melee',
    max: 9,
  },
  {
    name: 'heavy',
    description: 'Which heavy weapon?',
    compat: ['Arch-Gun Mod'],
    moddable: true,
    display: 'Heavy Gun',
    max: 8,
  },
  {
    name: 'archwing',
    description: 'Which archwing?',
    compat: ['Archwing Mod'],
    moddable: true,
    display: 'Archwing',
    max: 8,
  },
  {
    name: 'archgun',
    description: 'Which archgun?',
    compat: ['Arch-Gun Mod'],
    moddable: true,
    display: 'Arch-Gun',
    max: 8,
  },
  {
    name: 'archmelee',
    description: 'Which archmelee?',
    compat: ['Arch-Melee Mod'],
    moddable: true,
    display: 'Arch-Melee',
    max: 8,
  },
  {
    name: 'focus',
    description: 'Which focus tree?',
    choices: Build.focii,
  },
  {
    name: 'prism',
    description: 'Which prism?',
  },
  {
    name: 'necramech',
    description: 'Which Necramech?',
    compat: ['Necramech Mod'],
    moddable: true,
    display: 'Necramech',
    max: 12,
  },
  {
    name: 'necragun',
    description: 'Which archgun for the Necramech?',
    compat: ['Arch-Gun Mod'],
    moddable: true,
    display: 'Necra-Gun',
    max: 8,
  },
  {
    name: 'necramelee',
    description: 'Which Melee weapon for your Necramech?',
    compat: ['Arch-Melee Mod'],
    moddable: true,
    display: 'Necra-Melee',
    max: 8,
  },
];

const unmodable = ['id', 'owner_id', 'title', 'body', 'image', 'mods'];

export default class Builds extends Interaction {
  static enabled = games.includes('WARFRAME');

  /**
   * @type {Discord.ApplicationCommandData}
   */
  static command = {
    name: 'builds',
    description: 'Get various pieces of information',
    options: [
      {
        name: 'list',
        type: ApplicationCommandOptionType.Subcommand,
        description: 'Get all of my builds',
      },
      {
        name: 'get',
        type: ApplicationCommandOptionType.Subcommand,
        description: 'Search builds or get a specific id.',
        options: [
          {
            name: 'query',
            type: ApplicationCommandOptionType.String,
            description: 'Search string',
            required: true,
          },
        ],
      },
      {
        name: 'add',
        type: ApplicationCommandOptionType.Subcommand,
        description: 'Add a new build',
        options: buildParts.map((bp) => ({
          name: bp.name,
          type: ApplicationCommandOptionType.String,
          description: bp.description,
          choices: bp.choices,
        })),
      },
      {
        name: 'update',
        type: ApplicationCommandOptionType.Subcommand,
        description: 'Update a build',
        options: [
          {
            name: 'id',
            type: ApplicationCommandOptionType.String,
            description: 'Build Identifier',
            required: true,
          },
        ].concat(
          buildParts.map((bp) => ({
            name: bp.name,
            type: ApplicationCommandOptionType.String,
            description: bp.description,
            choices: bp.choices,
          }))
        ),
      },
      {
        name: 'remove',
        type: ApplicationCommandOptionType.Subcommand,
        description: 'Remove a build',
        options: [
          {
            name: 'id',
            type: ApplicationCommandOptionType.String,
            description: 'Build Identifier',
            required: true,
          },
        ].concat(
          buildParts.map((bp) => ({
            name: bp.name,
            type: ApplicationCommandOptionType.Boolean,
            description: bp.description,
          }))
        ),
      },
      {
        name: 'mod',
        type: ApplicationCommandOptionType.Subcommand,
        description: 'Set Mods for a build',
        options: [
          {
            name: 'id',
            type: ApplicationCommandOptionType.String,
            description: 'Build Identifier',
            required: true,
          },
        ],
      },
    ],
  };

  /**
   * Build out pages for the provided build
   * @param {Build} build to generate pages for
   * @param {CommandContext} ctx context for command
   * @returns {Array<Discord.EmbedBuilder>}
   */
  static #buildEmbedsForBuild(build, ctx) {
    const parsed = {};
    const pages = [];

    buildParts.forEach(({ name }) => {
      if (build[name]) {
        parsed[name] = {};
        const id = build[name];
        switch (name) {
          case 'archwing':
          case 'necramech':
          case 'warframe':
            parsed[name] = id?.uniqueName ? id : ctx.ws.warframe(id)?.[0];
            pages.push(new FrameEmbed(parsed[name], { i18n: ctx.i18n, locale: ctx.language }));
            break;
          case 'prism':
            return;
          case 'title':
          case 'focus':
            parsed[name] = build[name];
            break;
          default:
            parsed[name] = id?.uniqueName ? id : ctx.ws.weapon(id)?.[0];
            pages.push(new WeaponEmbed(parsed[name], { locale: ctx.language, i18n: ctx.i18n }));
            break;
        }
      }
    });
    if (parsed.focus || build.prism) {
      const focus = parsed.focus ? `**${ctx.i18n`Focus`}:** ${build.focus}` : '';
      const prism = build.prism
        ? new WeaponEmbed(build.prism?.uniqueName ? build.prism : ctx.ws.weapon(build.prism)[0], {
            locale: ctx.language,
            i18n: ctx.i18n,
          })
        : undefined;
      if (prism) {
        if (focus) {
          prism.description = `${focus}${prism.description}`;
        }
        pages.push(prism);
      } else {
        const operator = new EmbedBuilder({ title: ctx.i18n`Operator`, description: focus });
        pages.push(operator);
      }
    }
    return pages;
  }

  static async commandHandler(interaction, ctx) {
    const { options } = interaction;
    const action = options.getSubcommand(false);
    const query = options.getString('query', false);
    const id = options.getString('id', false);
    const params = {};
    buildParts.forEach((part) => {
      params[part.name] = options.getString(part.name, false);
    });
    params.owner = interaction.user;
    let build = await ctx.settings.getBuild(query || id);
    switch (action) {
      case 'list':
        const builds = await ctx.settings.getBuilds(false, interaction.user);
        if (builds.length > 0) {
          const buildGroups = createGroupedArray(builds, 10);
          let titleLen = (
            builds.length
              ? builds.map((result) => result.title.trim()).reduce((a, b) => (a.length > b.length ? a : b))
              : ''
          ).length;
          titleLen = titleLen < 10 ? 10 : titleLen;

          const tokens = buildGroups.map((buildGroup) => ({
            name: '\u200B',
            value: buildGroup
              .map(
                (member) =>
                  `\`${member.id} | ${(member?.title || '').padEnd(titleLen, '\u2003')} | Added by ${
                    typeof member.owner === 'object' ? member.owner.tag : member.owner
                  }\``
              )
              .join('\n'),
          }));

          const tokenGroups = createGroupedArray(tokens, 5);
          const pages = [];
          tokenGroups.forEach((tokenGroup) => {
            const fields = tokenGroup;
            fields[0].value = `\`${ctx.i18n`Build ID`} | ${ctx.i18n`Title`.padEnd(
              titleLen,
              '\u2003'
            )} | ${ctx.i18n`Owner`}\`\n${tokenGroup[0].value}`;
            pages.push({
              color: 0xcda2a3,
              fields,
            });
          });
          // setup pages
          return Collectors.paged(interaction, pages, ctx);
        }
        return interaction.reply({
          embeds: [{ color: 0xcda2a3, title: ctx.i18n`No builds for user` }],
          flags: ctx.ephemerate ? this.MessageFlags.Ephemeral : 0,
        });
      case 'get':
        if (build) {
          if (build.body) {
            return interaction.reply({
              embeds: [new BuildEmbed(undefined, build)],
              flags: ctx.ephemerate ? this.MessageFlags.Ephemeral : 0,
            });
          }
          const pages = this.#buildEmbedsForBuild(build, ctx);
          return Collectors.dynamic(interaction, pages, ctx);
        }
        const results = await ctx.settings.getBuildSearch(query);
        if (results.length) {
          const pages = [];
          results.forEach((result) => {
            const embed = new BuildEmbed(result);
            pages.push(embed);
          });
          return Collectors.dynamic(interaction, pages, ctx);
        }
        return interaction.reply({
          content: ctx.i18n`No builds found`,
          flags: ctx.ephemerate ? this.MessageFlags.Ephemeral : 0,
        });
      case 'update':
      case 'add':
        await interaction.deferReply({ ephemeral: true });
        if (Object.keys(params).length < 1) return interaction.reply({ content: ctx.i18n`Nah` });
        if (build) {
          buildParts.forEach((part) => {
            if (params[part.name]) build[part.name] = params[part.name];
          });
        } else {
          build = new Build(params, ctx.ws);
        }
        await ctx.settings.saveBuild(build.toJson());
        const pages = this.#buildEmbedsForBuild(build, ctx);
        return Collectors.dynamic(interaction, pages, ctx);
      case 'remove':
        if (
          build &&
          (build.owner.id === interaction.user.id || interaction.user.id === interaction.client.application.owner.id)
        ) {
          let thereWasAPart = false;
          buildParts.forEach(({ name }) => {
            if (options.get(name, false)) {
              thereWasAPart = true;
              if (name !== 'mods') delete build[name];
            }
          });
          if (!thereWasAPart) await ctx.settings.deleteBuild(id);
          else await ctx.settings.saveBuild(build);
          return interaction.reply({ content: 'buhleted', flags: ctx.ephemerate ? this.MessageFlags.Ephemeral : 0 });
        }
        break;
      case 'mod':
        if (!build) {
          return interaction.reply(ctx.i18n`Can't add mods when you haven't got a build.`);
        }
        await interaction.deferReply({ flags: ctx.ephemerate ? this.MessageFlags.Ephemeral : 0 });
        const populatedKeys = Object.keys(build.toJson())
          .filter((p) => !unmodable.includes(p))
          .filter((k) => build.toJson()[k]);
        if (!populatedKeys.length) {
          return interaction.reply(ctx.i18n`Can't add mods when you haven't got anything else`);
        }
        // write something to manage mods like we did with tracking
        // selection for build parts that are populated
        let current;
        const mods = {};
        build?.mods?.forEach((mod) => {
          mods[mod.target] = mod.mods.flat();
        });

        // for some reason, mods are being inserted into the array as `[Object object]`
        const currentMods = () =>
          Object.keys(mods)
            .map((k) => {
              if (mods?.[k]?.length && !unmodable.includes(k)) {
                const buildPart = buildParts.find((p) => p.name === k);
                if (!buildPart) return undefined;
                const modList = mods[k];
                const modStr = modList.map((m) => m.name || ctx.ws.mod(m)?.[0]?.name).join('\n\t');
                const warn = modList.length > buildPart.max ? ' :warning:' : '';
                return `**${buildPart.display}**: ${build[k]?.name || ''}${warn}\n\t${modStr}`;
              }
              return undefined;
            })
            .join('\n') || ctx.i18n`No Mods`;

        const selectPartRow = () =>
          new ActionRow({
            components: [
              new StringSelectMenuBuilder({
                minValues: 0,
                maxValues: 1,
                customId: 'select_part',
                placeholder: ctx.i18n`Select Build Part`,
                options: populatedKeys
                  .map((k) => ({
                    value: k,
                    label: buildParts.find((p) => p.name === k && p.moddable)?.display,
                    default: current?.name === k,
                  }))
                  .filter((k) => k && k.label),
              }),
            ],
          });
        const availableMods = () => (current ? createGroupedArray(ctx.ws.modsByType(current.compat), 25) : undefined);
        let modPage = 0;
        const navComponents = new ActionRow({
          components: [
            new ButtonBuilder({
              label: 'Previous',
              customId: 'previous',
              style: ButtonStyle.Secondary,
            }),
            new ButtonBuilder({
              label: 'Save',
              customId: 'save',
              style: ButtonStyle.Primary,
            }),
            new ButtonBuilder({
              label: 'Next',
              customId: 'next',
              style: ButtonStyle.Secondary,
            }),
          ],
        });
        const modChoices = () => {
          const available = availableMods();
          return [
            new ActionRow({
              components: [
                new StringSelectMenuBuilder({
                  minValues: 0,
                  maxValues: available?.[modPage]?.length || 1,
                  customId: 'select_mods',
                  placeholder: ctx.i18n`Select Mods to Apply`,
                  disabled: !available?.length,
                  options: available?.[modPage]?.map((a) => ({
                    label: a.name,
                    value: a.uniqueName,
                    default: !!mods?.[current?.name]?.find((f) => f.uniqueName === a.uniqueName),
                  })) || [
                    {
                      label: 'N/A',
                      value: 'na',
                    },
                  ],
                }),
              ],
            }),
            navComponents,
          ];
        };
        const modSelectionHandler = async (selection) => {
          await selection.deferUpdate();
          switch (selection.customId) {
            case 'select_part':
              current = buildParts.find((p) => p.name === selection.values[0]);
              modPage = 0;
              break;
            case 'select_mods':
              const available = availableMods();
              // TODO: !removal part doesn't sem to work
              mods[current.name] =
                mods?.[current.name]?.filter(
                  (m) => !available[modPage].map((a) => a.uniqueName).includes(m.uniqueName)
                ) || [];
              const selected = selection?.values?.map((value) => ctx.ws.mod(value)?.[0]).filter((n) => n);
              mods[current.name] = Array.from(new Set([...mods[current.name], ...selected]));
              break;
          }
          await interaction.editReply({
            content: currentMods(),
            flags: ctx.ephemerate ? this.MessageFlags.Ephemeral : 0,
            components: [selectPartRow(), ...modChoices()],
          });
        };
        const message = await interaction.editReply({
          content: currentMods(),
          flags: ctx.ephemerate ? this.MessageFlags.Ephemeral : 0,
          components: [selectPartRow(), ...modChoices()],
        });
        const modCollector = new InteractionCollector(interaction.client, {
          interactionType: InteractionType.MESSAGE_COMPONENT,
          componentType: ComponentType.SelectMenu,
          message,
          guild: interaction.guild,
          channel: interaction.channel,
        });
        modCollector.on('collect', modSelectionHandler);

        const modPageCollector = new InteractionCollector(interaction.client, {
          componentType: ComponentType.Button,
          interactionType: InteractionType.MessageComponent,
          message,
          guild: interaction.guild,
          channel: interaction.channel,
        });
        const modPageHandler = async (button) => {
          await button.deferUpdate({ flags: ctx.ephemerate ? this.MessageFlags.Ephemeral : 0 });
          switch (button.customId) {
            case 'previous':
              if (modPage > 1) modPage -= 1;
              break;
            case 'next':
              if (modPage <= availableMods().length) modPage += 1;
              break;
            case 'save': // save mods into build, save build
              build.mods = Object.keys(mods)
                .map((k) =>
                  k
                    ? {
                        target: k,
                        mods: mods[k],
                      }
                    : undefined
                )
                .filter((i) => i.mods);
              await ctx.settings.saveBuild(build.toJson());
              // selection for mods, filtered to compat with that part
              // before saving, error or "warn" if there's more than the type allows
              return interaction.editReply({
                content: currentMods(),
                flags: ctx.ephemerate ? this.MessageFlags.Ephemeral : 0,
                components: [
                  new ActionRow({
                    components: [
                      new ButtonBuilder({
                        label: 'Saved',
                        customId: 'save',
                        style: ButtonStyle.Success,
                        disabled: true,
                      }),
                    ],
                  }),
                ],
              });
          }

          if (modPage < 1) {
            modPage = 1;
          } else if (modPage > availableMods().length) {
            modPage = availableMods().length;
          }
          return interaction.editReply({
            content: currentMods(),
            flags: ctx.ephemerate ? this.MessageFlags.Ephemeral : 0,
            components: [selectPartRow(), ...modChoices()],
          });
        };
        modPageCollector.on('collect', modPageHandler);
        return undefined;
    }
    return interaction.reply({ content: ctx.i18n`Nah.`, flags: ctx.ephemerate ? this.MessageFlags.Ephemeral : 0 });
  }
}
