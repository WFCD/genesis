import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  EmbedBuilder,
  InteractionCollector,
  InteractionType,
} from 'discord.js';
import type { ButtonInteraction, ChatInputCommandInteraction } from 'discord.js';

import DarvoEmbed, { DarvoItemImageEmbed } from '#shared/embeds/DarvoEmbed';
import type { CommandContext } from '#shared/types/context';
import { resolveItemImageUrl, withEphemeral } from '#shared/utilities/CommonFunctions';

const FETCH_REPLY_TIMEOUT_MS = 10_000;

type DailyDeal = {
  item: string;
};

export async function replyDarvoDeal(
  interaction: ChatInputCommandInteraction,
  deal: DailyDeal,
  ctx: CommandContext,
  { platform, language, ephemeral }: { platform: string; language: string; ephemeral: boolean | undefined }
) {
  const built = new DarvoEmbed(deal, { platform, i18n: ctx.i18n, locale: language });
  const infoEmbed = EmbedBuilder.from(built);
  const imageUrl = await resolveItemImageUrl(deal.item);
  const buttonId = `genesis:${interaction.id}:darvo:image`;

  const components = imageUrl
    ? [
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder().setCustomId(buttonId).setLabel('Show Image').setStyle(ButtonStyle.Secondary)
        ),
      ]
    : [];

  await interaction.editReply(withEphemeral(ephemeral, { embeds: [infoEmbed], components }));

  if (!imageUrl) return;

  let message;
  try {
    message = await Promise.race([
      interaction.fetchReply(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('fetchReply timed out')), FETCH_REPLY_TIMEOUT_MS)
      ),
    ]);
  } catch {
    return;
  }

  const collector = new InteractionCollector(interaction.client, {
    interactionType: InteractionType.MessageComponent,
    componentType: ComponentType.Button,
    message,
    time: 600_000,
    filter: (i) => i.user.id === interaction.user.id && i.customId === buttonId,
  });

  collector.on('collect', async (button: ButtonInteraction) => {
    await button.deferUpdate();
    const imageBuilt = new DarvoItemImageEmbed(deal, imageUrl, { i18n: ctx.i18n, locale: language });
    const imageEmbed = EmbedBuilder.from(imageBuilt);
    await interaction.editReply(withEphemeral(ephemeral, { embeds: [infoEmbed, imageEmbed], components: [] }));
    collector.stop('done');
  });

  collector.on('end', (_, reason) => {
    if (reason !== 'done') {
      interaction.editReply({ components: [] }).catch(() => undefined);
    }
  });
}
