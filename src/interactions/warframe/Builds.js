'use strict';

const Discord = require('discord.js');
const { games } = require('../../CommonFunctions.js');

const { Constants: { ApplicationCommandOptionTypes: Types } } = Discord;
const BuildEmbed = require('../../embeds/BuildEmbed');
const { createSelectionCollector, createPagedInteractionCollector } = require('../../CommonFunctions');
const FrameEmbed = require('../../embeds/FrameEmbed');
const WeaponEmbed = require('../../embeds/WeaponEmbed');
const Build = require('../../models/Build.js');

const buildParts = [{
  name: 'warframe',
  description: 'Which Warframe?',
  required: true,
  compat: ['Warframe Mod'],
}, {
  name: 'primary',
  description: 'Which Primary?',
  compat: ['Rifle Mod', 'Shotgun Mod'],
}, {
  name: 'secondary',
  description: 'Which Secondary?',
  compat: ['Secondary Mod'],
}, {
  name: 'melee',
  description: 'Which melee weapon?',
  compat: ['Melee Mod'],
}, {
  name: 'heavy',
  description: 'Which heavy weapon?',
  compat: ['Arch-Gun Mod'],
}, {
  name: 'archwing',
  description: 'Which archwing?',
  compat: ['Archwing Mod'],
}, {
  name: 'archgun',
  description: 'Which archgun?',
  compat: ['Arch-Gun Mod'],
}, {
  name: 'archmelee',
  description: 'Which archmelee?',
  compat: ['Arch-Melee Mod'],
}, {
  name: 'focus',
  description: 'Which focus tree?',
  choices: Build.focii,
}, {
  name: 'prism',
  description: 'Which prism?',
}, {
  name: 'necramech',
  description: 'Which Necramech?',
  compat: ['Necramech Mod'],
},
// don't wanna support this yet... it's too complicated for my brain
// {
//   name: 'mods',
//   description: 'Which mods?',
// }
];

module.exports = class Builds extends require('../../models/Interaction') {
  static enabled = games.includes('WARFRAME');

  /**
   * @type {Discord.ApplicationCommandData}
   */
  static command = {
    name: 'builds',
    description: 'Get various pieces of information',
    options: [{
      name: 'get',
      type: Types.SUB_COMMAND,
      description: 'Search builds or get a specific id.',
      options: [{
        name: 'query',
        type: Types.STRING,
        description: 'Search string',
        required: true,
      }],
    }, {
      name: 'add',
      type: Types.SUB_COMMAND,
      description: 'Add a new build',
      options: buildParts.map(bp => ({
        name: bp.name,
        type: Types.STRING,
        description: bp.description,
        choices: bp.choices,
      })),
    }, {
      name: 'update',
      type: Types.SUB_COMMAND,
      description: 'Update a build',
      options: [{
        name: 'id',
        type: Types.STRING,
        description: 'Build Identifier',
        required: true,
      }].concat(buildParts.map(bp => ({
        name: bp.name,
        type: Types.STRING,
        description: bp.description,
        choices: bp.choices,
      }))),
    }, {
      name: 'remove',
      type: Types.SUB_COMMAND,
      description: 'Remove a build',
      options: [{
        name: 'id',
        type: Types.STRING,
        description: 'Build Identifier',
        required: true,
      }].concat(buildParts.map(bp => ({
        name: bp.name,
        type: Types.BOOLEAN,
        description: bp.description,
      }))),
    }],
  };

  /**
   * Build out pages for the provided build
   * @param {Build} build to generate pages for
   * @param {CommandContext} ctx context for command
   * @returns {Array<Discord.MessageEmbed>}
   */
  static #buildEmbedsForBuild (build, ctx) {
    const parsed = {};
    const pages = [];

    buildParts.forEach(({ name }) => {
      if (build[name]) {
        parsed[name] = {};
        const id = build[name];
        switch (name) {
          case 'archwing':
          case 'warframe':
          case 'necramech':
            parsed[name] = id?.uniqueName ? id : ctx.ws.warframe(id)?.[0];
            pages.push(new FrameEmbed(null, parsed[name], null));
            break;
          case 'prism':
            return;
          case 'focus':
            parsed[name] = build[name];
            break;
          default:
            parsed[name] = id?.uniqueName ? id : ctx.ws.weapon(id)?.[0];
            pages.push(new WeaponEmbed(null, parsed[name]));
            break;
        }
      }
    });
    if (parsed.focus || build.prism) {
      const focus = parsed.focus ? `**${ctx.i18n`Focus`}:** ${build.focus}` : '';
      const prism = build.prism
        ? new WeaponEmbed(null, build.prism?.uniqueName
          ? build.prism
          : ctx.ws.weapon(build.prism)[0])
        : null;
      if (prism) {
        if (focus) {
          prism.description = `${focus}${prism.description}`;
        }
        pages.push(prism);
      } else {
        const operator = new Discord.MessageEmbed({ title: ctx.i18n`Operator`, description: focus });
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
      case 'get':
        if (build) {
          if (build.body) {
            return interaction.reply({
              embeds: [new BuildEmbed(null, build)],
              ephemeral: ctx.ephemerate,
            });
          }
          const pages = await this.#buildEmbedsForBuild(build, ctx);
          return pages.length < 26
            ? createSelectionCollector(interaction, pages, ctx)
            : createPagedInteractionCollector(interaction, pages, ctx);
        }
        const results = await ctx.settings.getBuildSearch(query);
        if (results.length) {
          const embeds = [];
          results.forEach((result) => {
            const embed = new BuildEmbed(null, result);
            embeds.push(embed);
          });
          return results.length < 26
            ? createSelectionCollector(interaction, embeds, ctx)
            : createPagedInteractionCollector(interaction, embeds, ctx);
        }
        return interaction.reply({ content: ctx.i18n`No builds found`, ephemeral: ctx.ephemerate });
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
        ctx.logger.info(JSON.stringify(build.toJson()));
        await ctx.settings.saveBuild(build.toJson());
        const pages = this.#buildEmbedsForBuild(build, ctx);
        return pages.length < 26
          ? createSelectionCollector(interaction, pages, ctx)
          : createPagedInteractionCollector(interaction, pages, ctx);
      case 'remove':
        if (build
          && (build.owner.id === interaction.user.id
            || interaction.user.id === interaction.client.application.owner.id)) {
          let thereWasAPart = false;
          buildParts.forEach(({ name }) => {
            if (options.get(name, false)) {
              thereWasAPart = true;
              if (name !== 'mods') delete build[name];
            }
          });
          if (!thereWasAPart) await ctx.settings.deleteBuild(id);
          else await ctx.settings.saveBuild(build);
          return interaction.reply({ content: 'buhleted', ephemeral: ctx.ephemerate });
        }
        break;
      default:
        break;
    }
    return interaction.reply({ content: ctx.i18n`Nah.`, ephemeral: ctx.ephemerate });
  }
};
