import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  EmbedBuilder,
  InteractionCollector,
  InteractionType,
  type ButtonInteraction,
  type ChatInputCommandInteraction,
} from 'discord.js';

import WhereisEmbed, {
  WHEREIS_SORT_LABELS,
  sortWhereisRows,
  type WhereisRow,
  type WhereisSort,
} from '#shared/embeds/WhereisEmbed';
import type { CommandContext } from '#shared/types/context';
import { createGroupedArray, withEphemeral } from '#shared/utilities/CommonFunctions';

const PAGE_SIZE = 16;
const SORT_MODES: WhereisSort[] = ['chance', 'item', 'location'];

const shapePages = (pages: WhereisEmbed[]) =>
  pages.map((embed, index) => {
    if (!embed.data.description) embed.setDescription('_ _');
    if (pages.length > 1) {
      embed.setFooter({ text: `Page ${index + 1}/${pages.length}` });
    }
    return EmbedBuilder.from(embed);
  });

const buildPages = (results: WhereisRow[], query: string, sort: WhereisSort) =>
  shapePages(
    createGroupedArray(sortWhereisRows(results, sort), PAGE_SIZE).map((chunk) => new WhereisEmbed(chunk, query, sort))
  );

const buildComponents = (sort: WhereisSort, pageCount: number) => {
  const buttons: ButtonBuilder[] = SORT_MODES.filter((mode) => mode !== sort).map((mode) =>
    new ButtonBuilder()
      .setCustomId(`whereis:sort:${mode}`)
      .setLabel(`Sort: ${WHEREIS_SORT_LABELS[mode]}`)
      .setStyle(ButtonStyle.Secondary)
  );

  if (pageCount > 1) {
    buttons.push(
      new ButtonBuilder().setCustomId('whereis:previous').setLabel('Previous').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('whereis:stop').setLabel('Stop').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId('whereis:next').setLabel('Next').setStyle(ButtonStyle.Secondary)
    );
  }

  return [new ActionRowBuilder<ButtonBuilder>().addComponents(...buttons)];
};

export async function browseWhereisResults(
  interaction: ChatInputCommandInteraction,
  ctx: CommandContext,
  results: WhereisRow[],
  query: string
) {
  let sort: WhereisSort = 'chance';
  let page = 1;
  let pagedPages = buildPages(results, query, sort);

  const render = () =>
    interaction.editReply(
      withEphemeral(ctx.ephemerate, {
        embeds: [pagedPages[page - 1]],
        components: buildComponents(sort, pagedPages.length),
      })
    );

  await render();

  const message = await interaction.fetchReply();
  const collector = new InteractionCollector(interaction.client, {
    interactionType: InteractionType.MessageComponent,
    componentType: ComponentType.Button,
    message,
    guild: interaction.guild,
    channel: interaction.channel,
  });

  const handleButton = async (button: ButtonInteraction) => {
    if (button.user.id !== interaction.user.id) {
      return button.reply(withEphemeral(true, { content: 'Only the command author can use these controls.' }));
    }

    await button.deferUpdate();

    if (button.customId.startsWith('whereis:sort:')) {
      sort = button.customId.slice('whereis:sort:'.length) as WhereisSort;
      pagedPages = buildPages(results, query, sort);
      page = 1;
    } else {
      switch (button.customId) {
        case 'whereis:previous':
          page = Math.max(1, page - 1);
          break;
        case 'whereis:next':
          page = Math.min(pagedPages.length, page + 1);
          break;
        case 'whereis:stop':
          collector.stop('user');
          await interaction.editReply(
            withEphemeral(ctx.ephemerate, { embeds: [pagedPages[page - 1]], components: [] })
          );
          return;
        default:
          return;
      }
    }

    await render();
  };

  collector.on('collect', handleButton);
  collector.on('end', async () => {
    if (pagedPages.length) {
      await interaction.editReply(
        withEphemeral(ctx.ephemerate, { embeds: [pagedPages[Math.min(page, pagedPages.length) - 1]], components: [] })
      );
    }
  });
}
