import { ApplicationCommandOptionType as Types } from 'discord.js';

import { cmds, platformMap } from '#shared/resources/index';
import { withEphemeral } from '#shared/utilities/CommonFunctions';

import Interaction from '../../models/Interaction';

export default class PriceCheck extends Interaction {
  static enabled = true;

  static command = {
    ...cmds.pc,
    options: [
      {
        ...cmds.query,
        type: Types.String,
        required: true,
      },
      {
        ...cmds.platform,
        type: Types.String,
        choices: platformMap,
      },
      {
        ...cmds['pc.rank'],
        type: Types.Integer,
        min_value: 0,
        max_value: 10,
      },
      {
        ...cmds['pc.ranks'],
        type: Types.String,
      },
    ],
  };

  static async commandHandler(interaction, ctx) {
    const { options } = interaction;
    const platform = options?.get('platform')?.value || ctx.platform || 'pc';
    const query = options?.get('query')?.value;
    const rank = options.getInteger('rank');
    const ranks = options.getString('ranks');

    await interaction.deferReply(withEphemeral(ctx.ephemerate));
    const embeds = await ctx.ws.pricecheck(query, {
      platform,
      ...(rank !== null ? { rank } : {}),
      ...(ranks ? { ranks } : {}),
    });
    return interaction.editReply(withEphemeral(ctx.ephemerate, { embeds }));
  }
}
