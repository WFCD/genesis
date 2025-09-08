import { ApplicationCommandOptionType } from 'discord.js';

import { cmds, platformMap } from '../../resources/index.js';
import Interaction from '../../models/Interaction.js';

export default class PriceCheck extends Interaction {
  static enabled = true;

  static command = {
    ...cmds.pc,
    options: [
      {
        ...cmds.query,
        type: ApplicationCommandOptionType.String,
        required: true,
      },
      {
        ...cmds.platform,
        type: ApplicationCommandOptionType.String,
        choices: platformMap,
      },
    ],
  };

  static async commandHandler(interaction, ctx) {
    const { options } = interaction;
    const platform = options?.get('platform')?.value || ctx.platform || 'pc';
    const query = options?.get('query')?.value;

    await interaction.deferReply({ flags: ctx.ephemerate ? this.MessageFlags.Ephemeral : 0 });
    const embeds = await ctx.ws.pricecheck(query, { platform });
    return interaction.editReply({ embeds, flags: ctx.ephemerate ? this.MessageFlags.Ephemeral : 0 });
  }
}
