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
    ],
  };

  static async commandHandler(interaction, ctx) {
    const { options } = interaction;
    const platform = options?.get('platform')?.value || ctx.platform || 'pc';
    const query = options?.get('query')?.value;

    await interaction.deferReply(withEphemeral(ctx.ephemerate));
    const embeds = await ctx.ws.pricecheck(query, { platform });
    return interaction.editReply(withEphemeral(ctx.ephemerate, { embeds }));
  }
}
