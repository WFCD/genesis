import { ApplicationCommandOptionType as Types } from 'discord.js';

import { cmds } from '#shared/resources/index';
import { games, withEphemeral } from '#shared/utilities/CommonFunctions';
import type { CommandContext } from '#shared/types/context';

import Interaction from '../../models/Interaction';

import BuildsSearchUI from './BuildsSearchUI';

export default class Builds extends Interaction {
  static enabled = games.includes('WARFRAME');

  static command = {
    ...cmds.builds,
    options: [
      {
        ...cmds['builds.search'],
        type: Types.Subcommand,
        options: [
          {
            ...cmds['builds.query'],
            type: Types.String,
            required: true,
          },
        ],
      },
    ],
  };

  static async commandHandler(interaction, ctx: CommandContext) {
    const query = interaction.options.getString('query', true);
    if (interaction.options.getSubcommand(false) !== 'search') {
      return interaction.reply(withEphemeral(ctx.ephemerate, { content: ctx.i18n`Use \`/builds search\`.` }));
    }
    return BuildsSearchUI.start(interaction, ctx, query);
  }
}
