'use strict';

const Discord = require('discord.js');

const { games } = require('../../CommonFunctions.js');

const { Constants: { ApplicationCommandOptionTypes: Types } } = Discord;

const levels = [{
  type: Types.INTEGER,
  name: 'base_level',
  description: 'Enemy\'s base level',
  required: true,
}, {
  type: Types.INTEGER,
  name: 'current_level',
  description: "Enemy's current level",
  required: true,
}, {
  type: Types.INTEGER,
  name: 'base',
  description: 'Base value for the current calculation',
}];

const smoothstep = (currentLevel, baseLevel) => {
  const diff = (currentLevel - baseLevel);
  const t = ((diff - 70) / 10);
  if (diff < 70) return 0;
  if (diff > 80) return 1;
  return 3 * (t * t) - 2 * (t * t * t);
};

module.exports = class Calculator extends require('../../models/Interaction') {
  static enabled = games.includes('WARFRAME');

  static command = {
    name: 'calc',
    description: 'Get Warframe Worldstate Information',
    options: [{
      type: Types.SUB_COMMAND,
      name: 'shields',
      description: 'Calculate Enemy Shield amounts',
      options: levels,
    }, {
      type: Types.SUB_COMMAND,
      name: 'armor',
      description: 'Calculate Enemy Armor amounts',
      options: levels,
    }, {
      type: Types.SUB_COMMAND,
      name: 'health',
      description: 'Calculate Enemy Health amounts',
      options: levels,
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
    const options = interaction.options;

    const base = options.get('base_level').value;
    const current = options.get('current_level').value;
    const val = options.get('base').value;
    const range = current - base;

    let f1;
    let f2;

    const multiplier = () => Number(((f1() * (1 - smoothstep(current, base)))
      + (f2() * smoothstep(current, base))) * Number(val || 1)).toFixed(2);

    /* eslint-disable no-case-declarations */
    switch (subcommand) {
      case 'shields':
        f1 = () => 1 + (0.02 * (range ** 1.75));
        f2 = () => 1 + (1.6 * (range ** 0.75));
        const shields = multiplier();
        return interaction.reply({
          content: ctx.i18n`The Enemy would have ${shields} shields`,
          ephemeral: ctx.ephemerate,
        });
      case 'health':
        f1 = () => 1 + (0.015 * (range ** 2));
        f2 = () => 1 + ((24 * (Math.sqrt(5)) * range ** 0.5));
        const health = multiplier();
        return interaction.reply({
          content: ctx.i18n`The Enemy would have ${health} health`,
          ephemeral: ctx.ephemerate,
        });
      case 'armor':
        f1 = () => 1 + (0.005 * (range ** 1.75));
        f2 = () => 1 + (0.4 * (range ** 0.75));
        const armor = multiplier();
        return interaction.reply({
          content: ctx.i18n`The Enemy would have ${armor} armor`,
          ephemeral: ctx.ephemerate,
        });
      default:
        return interaction.reply({ content: 'ok', ephemeral: ctx.ephemerate });
    }
  }
};
