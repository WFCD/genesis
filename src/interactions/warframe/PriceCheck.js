import Discord from 'discord.js';

import { cmds, platformMap } from '../../resources/index.js';
import Interaction from '../../models/Interaction.js';

const {
  Constants: { ApplicationCommandOptionTypes: Types },
} = Discord;

export default class PriceCheck extends Interaction {
  static enabled = true;

  static command = {
    ...cmds.pc,
    options: [
      {
        ...cmds.query,
        type: Types.STRING,
        required: true,
      },
      {
        ...cmds.platform,
        type: Types.STRING,
        choices: platformMap,
      },
    ],
  };

  static async commandHandler(interaction, ctx) {
    const { options } = interaction;
    const platform = options?.get('platform')?.value || ctx.platform || 'pc';
    const query = options?.get('query')?.value;

    await interaction.deferReply({ ephemeral: ctx.ephemerate });
    const embeds = await ctx.ws.pricecheck(query, { platform });
    return interaction.editReply({ embeds, ephemeral: ctx.ephemerate });
  }
}
