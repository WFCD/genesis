import { ApplicationCommandOptionType as Types } from 'discord.js';

import WikiEmbed from '#shared/embeds/WikiEmbed';
import { cmds } from '#shared/resources/index';
import { games, withEphemeral } from '#shared/utilities/CommonFunctions';
import { lookupWiki } from '#shared/utilities/WarframeWikiClient';

import Interaction from '../../models/Interaction';

const wikiOptions = [
  {
    ...cmds.query,
    type: Types.String,
    required: true,
  },
];

export default class Wiki extends Interaction {
  static enabled = games.includes('WARFRAME');

  static command = undefined;

  static commands = [
    {
      ...cmds.wiki,
      options: wikiOptions,
    },
    {
      ...cmds.search,
      options: wikiOptions,
    },
  ];

  static async commandHandler(interaction, ctx) {
    const query = interaction.options.getString('query', true);

    await interaction.deferReply(withEphemeral(ctx.ephemerate));

    try {
      const result = await lookupWiki(query);
      return interaction.editReply(withEphemeral(ctx.ephemerate, { embeds: [new WikiEmbed(result)] }));
    } catch (err) {
      ctx.logger?.error?.(err, 'Wiki');
      return interaction.editReply(
        withEphemeral(ctx.ephemerate, {
          content: ctx.i18n`Could not reach the Warframe Wiki right now. Try again in a moment.`,
        })
      );
    }
  }
}
