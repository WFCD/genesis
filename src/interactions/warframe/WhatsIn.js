import { ApplicationCommandOptionType } from 'discord.js';

import WhatsInEmbed from '../../embeds/WhatsinEmbed.js';
import Interaction from '../../models/Interaction.js';
import { games, toTitleCase } from '../../utilities/CommonFunctions.js';
import { cmds } from '../../resources/index.js';

const queryOpt = [
  {
    ...cmds['whatsin.query'],
    type: ApplicationCommandOptionType.String,
    required: true,
  },
];

export default class WhatsIn extends Interaction {
  static enabled = games.includes('WARFRAME');

  /**
   * @type {Discord.ApplicationCommandData}
   */
  static command = {
    ...cmds.whatsin,
    options: [
      {
        name: 'relic_era',
        type: ApplicationCommandOptionType.String,
        description: 'What relic tier is the relic from?',
        required: true,
        choices: [
          {
            name: 'Lith',
            value: 'lith',
          },
          {
            name: 'Neo',
            value: 'neo',
          },
          {
            name: 'Meso',
            value: 'meso',
          },
          {
            name: 'Axi',
            value: 'axi',
          },
          {
            name: 'Requiem',
            value: 'requiem',
          },
        ],
      },
      ...queryOpt,
    ],
  };

  /**
   * Handle a discord interaction
   * @param {Discord.CommandInteraction} interaction interaction to handle
   * @param {CommandContext} ctx context object
   * @returns {Promise<*>}
   */
  static async commandHandler(interaction, ctx) {
    // args
    const tier = toTitleCase(interaction.options.get('relic_era').value);
    const query = toTitleCase(interaction.options.get('query').value);
    const data = await ctx.ws.relic(tier, tier.toLowerCase() === 'requiem' ? query.toUpperCase() : query);
    if (!data || !Object.keys(data).length) return interaction.reply(ctx.i18n`Sorry, no such relic`);
    const embed = new WhatsInEmbed(data, tier, query);
    return interaction.reply({ embeds: [embed], flags: ctx.ephemerate ? this.MessageFlags.Ephemeral : 0 });
  }
}
