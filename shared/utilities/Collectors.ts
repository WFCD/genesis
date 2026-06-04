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
type PageEmbed =
  | BaseEmbed
  | (EmbedBuilder & {
      description?: string | null;
      title?: string | null;
      footer?: { text?: string; iconURL?: string };
    });

type CollectorMessage = Message | InteractionResponse;

async function interactionMessage(
  interaction: ChatInputCommandInteraction,
  payload: Parameters<ChatInputCommandInteraction['reply']>[0]
): Promise<CollectorMessage> {
  if (interaction.deferred || interaction.replied) {
    return interaction.editReply(payload as Parameters<ChatInputCommandInteraction['editReply']>[0]);
  }
  return interaction.reply(payload);
}

export default class Collectors {
  static #navComponents = [
    new ActionRowBuilder<ButtonBuilder>({
      components: [
        new ButtonBuilder({
          label: 'Previous',
          customId: 'previous',
          style: ButtonStyle.Secondary,
        }),
        new ButtonBuilder({
          label: 'Stop',
          customId: 'stop',
          style: ButtonStyle.Danger,
        }),
        new ButtonBuilder({
          label: 'Next',
          customId: 'next',
          style: ButtonStyle.Secondary,
        }),
      ],
    }),
  ];

  static #confirmationComponents = [
    new ActionRowBuilder<ButtonBuilder>({
      components: [
        new ButtonBuilder({
          label: 'yes',
          customId: 'confirm',
          style: ButtonStyle.Primary,
        }),
        new ButtonBuilder({
          label: 'no',
          customId: 'deny',
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
    return pages?.length < 26 ? this.selection(interaction, pages, ctx) : this.paged(interaction, pages, ctx);
  }

  static #shapePages(pages: PageEmbed[]): EmbedBuilder[] {
    return pages.map((newPage, index) => {
      const pageInd = `Page ${index + 1}/${pages.length}`;
      if (!newPage.description) newPage.setDescription('_ _');
      if (newPage.footer) {
        if (newPage.footer.text?.indexOf('Page ') === -1) {
          newPage.setFooter({ text: `${pageInd} • ${newPage.footer.text}`, iconURL: newPage.footer.iconURL });
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
    const selections = pages.map((embed, index) => ({
      label: embed.title ?? `Page ${index + 1}`,
      value: `${index}`,
    }));

    const menu = () => [
      new ActionRowBuilder<StringSelectMenuBuilder>({
        components: [
          new StringSelectMenuBuilder({
            customId: 'select',
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
    const message = await interactionMessage(interaction, payload);

    const collector = new InteractionCollector(interaction.client, {
      interactionType: InteractionType.MessageComponent,
      componentType: ComponentType.StringSelect,
      message: message as Message,
      guild: interaction.guild,
      channel: interaction.channel,
    });

    const selectionHandler = async (selection: StringSelectMenuInteraction) => {
      await selection.deferUpdate(withEphemeral(ctx.ephemerate));
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
    const embeds = [pagedPages[page - 1]];
    const message = await interactionMessage(
      interaction,
      withEphemeral(ctx.ephemerate, { embeds, components: this.#navComponents })
    );

    const collector = new InteractionCollector(interaction.client, {
      interactionType: InteractionType.MessageComponent,
      componentType: ComponentType.Button,
      message: message as Message,
      guild: interaction.guild,
      channel: interaction.channel,
    });

    const buttonHandler = async (button: ButtonInteraction) => {
      await button?.deferUpdate(withEphemeral(ctx.ephemerate));
      switch (button.customId) {
        case 'previous':
          if (page > 1) page -= 1;
          break;
        case 'next':
          if (page <= pagedPages.length) page += 1;
          break;
        case 'first':
          page = 1;
          break;
        case 'last':
          page = pagedPages.length;
          break;
        case 'stop':
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
        withEphemeral(ctx.ephemerate, { embeds: [pagedPages[page - 1]], components: this.#navComponents })
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
    const message = await interactionMessage(
      interaction,
      withEphemeral(ctx.ephemerate, {
        content: ctx.i18n`Are you sure?`,
        components: this.#confirmationComponents,
      })
    );

    const collector = new InteractionCollector(interaction.client, {
      interactionType: InteractionType.MessageComponent,
      componentType: ComponentType.Button,
      max: 1,
      message: message as Message,
      guild: interaction.guild,
      channel: interaction.channel,
    });

    const bh = async (button: ButtonInteraction) => {
      try {
        switch (button.customId) {
          case 'deny':
            await onDeny();
            break;
          case 'confirm':
            await onConfirm();
            break;
          default:
            break;
        }
      } finally {
        collector.checkEnd();
      }
    };
    collector.on('collect', bh);
    collector.on('end', (_collected, reason) => ctx.logger?.debug(`closed with ${reason}`));
  }
}
