import { ApplicationCommandOptionType as Types } from 'discord.js';

import WhatsInEmbed from '#shared/embeds/WhatsinEmbed';
import { games, toTitleCase, withEphemeral } from '#shared/utilities/CommonFunctions';
import { cmds } from '#shared/resources/index';

import Interaction from '../../models/Interaction';

const queryOpt = [
  {
    ...cmds['whatsin.query'],
    type: Types.String,
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
        type: Types.String,
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
    const tier = toTitleCase(interaction.options.getString('relic_era', true));
    let query = interaction.options.getString('query', true).trim();

    query = query.replace(new RegExp(`^${tier}\\s+`, 'i'), '').trim();
    if (tier.toLowerCase() === 'requiem') {
      query = query.toUpperCase();
    } else {
      query = toTitleCase(query);
    }

    const data = await ctx.ws.relic(tier, query);
    if (!data || !Object.keys(data).length) {
      return interaction.reply(withEphemeral(ctx.ephemerate, { content: ctx.i18n`Sorry, no such relic` }));
    }

    const embed = new WhatsInEmbed(data, tier, query);
    return interaction.reply(withEphemeral(ctx.ephemerate, { embeds: [embed] }));
  }
}
