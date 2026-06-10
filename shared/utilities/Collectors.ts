import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  EmbedBuilder,
  InteractionCollector,
  InteractionResponse,
  InteractionType,
  StringSelectMenuBuilder,
} from 'discord.js';
import type { ButtonInteraction, ChatInputCommandInteraction, Message, StringSelectMenuInteraction } from 'discord.js';

import type BaseEmbed from '#shared/embeds/BaseEmbed';
import type { CommandContext } from '#shared/types/context';
import { withEphemeral } from '#shared/utilities/CommonFunctions';

/** Embed pages passed to collector helpers. */
type PageEmbed = BaseEmbed | EmbedBuilder;

type CollectorMessage = Message | InteractionResponse;

const FETCH_REPLY_TIMEOUT_MS = 10_000;

async function interactionMessage(
  interaction: ChatInputCommandInteraction,
  payload: Parameters<ChatInputCommandInteraction['reply']>[0]
): Promise<CollectorMessage> {
  if (interaction.deferred || interaction.replied) {
    return interaction.editReply(payload as Parameters<ChatInputCommandInteraction['editReply']>[0]);
  }
  return interaction.reply(payload);
}

async function collectorMessage(
  interaction: ChatInputCommandInteraction,
  payload: Parameters<ChatInputCommandInteraction['reply']>[0]
): Promise<Message | null> {
  await interactionMessage(interaction, payload);
  try {
    return await Promise.race([
      interaction.fetchReply(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('fetchReply timed out')), FETCH_REPLY_TIMEOUT_MS)
      ),
    ]);
  } catch (error) {
    interaction.client.emit?.('error', error as Error);
    return null;
  }
}

const embedTitle = (embed: PageEmbed) => embed.data.title ?? null;

const embedDescription = (embed: PageEmbed) => embed.data.description ?? null;

const embedFooter = (embed: PageEmbed) => embed.data.footer;

const pageLabel = (embed: PageEmbed, index: number) => String(embedTitle(embed) ?? `Page ${index + 1}`).slice(0, 100);

export default class Collectors {
  static #navComponents = (interaction: ChatInputCommandInteraction) => [
    new ActionRowBuilder<ButtonBuilder>({
      components: [
        new ButtonBuilder({
          label: 'Previous',
          customId: `genesis:${interaction.id}:previous`,
          style: ButtonStyle.Secondary,
        }),
        new ButtonBuilder({
          label: 'Stop',
          customId: `genesis:${interaction.id}:stop`,
          style: ButtonStyle.Danger,
        }),
        new ButtonBuilder({
          label: 'Next',
          customId: `genesis:${interaction.id}:next`,
          style: ButtonStyle.Secondary,
        }),
      ],
    }),
  ];

  static #confirmationComponents = (interaction: ChatInputCommandInteraction) => [
    new ActionRowBuilder<ButtonBuilder>({
      components: [
        new ButtonBuilder({
          label: 'yes',
          customId: `genesis:${interaction.id}:confirm`,
          style: ButtonStyle.Primary,
        }),
        new ButtonBuilder({
          label: 'no',
          customId: `genesis:${interaction.id}:deny`,
          style: ButtonStyle.Secondary,
        }),
      ],
    }),
  ];

  static async dynamic(
    interaction: ChatInputCommandInteraction,
    pages: PageEmbed[],
    ctx: CommandContext
  ): Promise<CollectorMessage | void> {
    return pages?.length <= 25 ? this.selection(interaction, pages, ctx) : this.paged(interaction, pages, ctx);
  }

  static #shapePages(pages: PageEmbed[]): EmbedBuilder[] {
    return pages.map((newPage, index) => {
      const pageInd = `Page ${index + 1}/${pages.length}`;
      if (!embedDescription(newPage)) newPage.setDescription('_ _');
      const footer = embedFooter(newPage);
      if (footer?.text) {
        if (footer.text.indexOf('Page ') === -1) {
          newPage.setFooter({
            text: `${pageInd} • ${footer.text}`,
            iconURL: footer.icon_url ?? (footer as { iconURL?: string }).iconURL,
          });
        }
      } else {
        newPage.setFooter({ text: pageInd });
      }
      return EmbedBuilder.from(newPage);
    });
  }

  static async selection(
    interaction: ChatInputCommandInteraction,
    pages: PageEmbed[],
    ctx: CommandContext
  ): Promise<CollectorMessage | void> {
    if (pages.length === 1) {
      const payload = withEphemeral(ctx.ephemerate, { embeds: [pages[0]] });
      return interactionMessage(interaction, payload);
    }
    let page = 1;
    const pagedPages = this.#shapePages(pages);
    const selections = pagedPages.map((embed, index) => ({
      label: pageLabel(embed, index),
      value: `${index}`,
    }));

    const menu = () => [
      new ActionRowBuilder<StringSelectMenuBuilder>({
        components: [
          new StringSelectMenuBuilder({
            customId: `genesis:${interaction.id}:select`,
            placeholder: ctx.i18n`Select Page`,
            minValues: 1,
            maxValues: 1,
            options: selections.map((s, i) => ({
              ...s,
              default: i === page - 1,
            })),
          }),
        ],
      }),
    ];

    const payload = withEphemeral(ctx.ephemerate, { embeds: [pagedPages[page - 1]], components: menu() });
    const message = await collectorMessage(interaction, payload);
    if (!message) {
      return interactionMessage(interaction, withEphemeral(ctx.ephemerate, { embeds: [pagedPages[page - 1]] }));
    }

    const collector = new InteractionCollector(interaction.client, {
      interactionType: InteractionType.MessageComponent,
      componentType: ComponentType.StringSelect,
      message,
      guild: interaction.guild,
      channel: interaction.channel,
      filter: (i) => i.user.id === interaction.user.id,
    });

    const selectionHandler = async (selection: StringSelectMenuInteraction) => {
      await selection.deferUpdate();
      page = Number.parseInt(selection.values[0], 10) + 1;
      if (page < 1) {
        page = 1;
      } else if (page > pagedPages.length) {
        page = pagedPages.length;
      }
      await interaction.editReply(
        withEphemeral(ctx.ephemerate, { embeds: [pagedPages[page - 1]], components: menu() })
      );
    };
    collector.on('collect', selectionHandler);
    const blank = async () =>
      interaction.editReply(withEphemeral(ctx.ephemerate, { embeds: [pagedPages[page - 1]], components: [] }));
    collector.on('end', blank);
    collector.on('dispose', blank);
    return message;
  }

  static async paged(
    interaction: ChatInputCommandInteraction,
    pages: PageEmbed[],
    ctx: CommandContext
  ): Promise<CollectorMessage | void> {
    if (!interaction.deferred) await interaction.deferReply(withEphemeral(ctx.ephemerate));
    let page = 1;
    if (pages.length === 1) {
      const payload = withEphemeral(ctx.ephemerate, { embeds: [pages[0]] });
      return interactionMessage(interaction, payload);
    }
    const pagedPages = this.#shapePages(pages);
    const navComponents = this.#navComponents(interaction);
    const message = await collectorMessage(
      interaction,
      withEphemeral(ctx.ephemerate, { embeds: [pagedPages[page - 1]], components: navComponents })
    );
    if (!message) {
      return interactionMessage(interaction, withEphemeral(ctx.ephemerate, { embeds: [pagedPages[page - 1]] }));
    }

    const collector = new InteractionCollector(interaction.client, {
      interactionType: InteractionType.MessageComponent,
      componentType: ComponentType.Button,
      message,
      guild: interaction.guild,
      channel: interaction.channel,
      filter: (i) => i.user.id === interaction.user.id,
    });

    const buttonHandler = async (button: ButtonInteraction) => {
      await button.deferUpdate();
      switch (button.customId) {
        case `genesis:${interaction.id}:previous`:
          if (page > 1) page -= 1;
          break;
        case `genesis:${interaction.id}:next`:
          if (page < pagedPages.length) page += 1;
          break;
        case `genesis:${interaction.id}:stop`:
          collector.stop('user');
          collector.checkEnd();
          await interaction.editReply(
            withEphemeral(ctx.ephemerate, { embeds: [pagedPages[page - 1]], components: [] })
          );
          return;
        default:
          break;
      }

      if (page < 1) {
        page = 1;
      } else if (page > pagedPages.length) {
        page = pagedPages.length;
      }
      await interaction.editReply(
        withEphemeral(ctx.ephemerate, { embeds: [pagedPages[page - 1]], components: navComponents })
      );
    };
    collector.on('collect', buttonHandler);
    collector.on('end', async (_collected, reason) => ctx.logger?.debug(`closed with ${reason}`));
    const blank = async () =>
      interaction.editReply(withEphemeral(ctx.ephemerate, { embeds: [pagedPages[page - 1]], components: [] }));
    collector.on('end', blank);
    collector.on('dispose', blank);
    return message;
  }

  static async confirmation(
    interaction: ChatInputCommandInteraction,
    onConfirm: () => Promise<void>,
    onDeny: () => Promise<void>,
    ctx: CommandContext
  ): Promise<void> {
    const payload = withEphemeral(ctx.ephemerate, {
      content: ctx.i18n`Are you sure?`,
      components: this.#confirmationComponents(interaction),
    });
    const message = await collectorMessage(interaction, payload);
    if (!message) {
      ctx.logger?.error?.('confirmation collector could not fetch reply');
      return;
    }

    const collector = new InteractionCollector(interaction.client, {
      interactionType: InteractionType.MessageComponent,
      componentType: ComponentType.Button,
      max: 1,
      message,
      guild: interaction.guild,
      channel: interaction.channel,
      filter: (i) => i.user.id === interaction.user.id,
    });

    const bh = async (button: ButtonInteraction) => {
      try {
        await button.deferUpdate();
        switch (button.customId) {
          case `genesis:${interaction.id}:deny`:
            await onDeny();
            break;
          case `genesis:${interaction.id}:confirm`:
            await onConfirm();
            break;
          default:
            break;
        }
      } catch (error) {
        ctx.logger?.error?.(error);
      } finally {
        collector.stop('user');
      }
    };
    collector.on('collect', bh);
    collector.on('end', (_collected, reason) => ctx.logger?.debug(`closed with ${reason}`));
  }
}
