import {
  EmbedBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
  InteractionCollector,
  StringSelectMenuBuilder,
  InteractionType,
  ComponentType,
} from 'discord.js';

export default class Collectors {
  static #navComponents = [
    new ActionRowBuilder({
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
    new ActionRowBuilder({
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

  static async dynamic(interaction, pages, ctx) {
    return pages?.length < 26 ? this.selection(interaction, pages, ctx) : this.paged(interaction, pages, ctx);
  }

  /**
   * Update pages to have additional criteria and safety check fields like description
   * @param {Array<Discord.EmbedBuilder>} pages to reshape as desired
   * @returns {Array<EmbedBuilder>}
   */
  static #shapePages(pages) {
    return pages.map((newPage, index) => {
      const pageInd = `Page ${index + 1}/${pages.length}`;
      if (!newPage.description) newPage.setDescription('_ _');
      if (newPage.footer) {
        if (newPage instanceof EmbedBuilder) {
          if (newPage.footer.text.indexOf('Page ') === -1) {
            newPage.setFooter({ text: `${pageInd} • ${newPage.footer.text}`, iconURL: newPage.footer.iconURL });
          }
        } else if (newPage.footer.text) {
          if (newPage.footer.text.indexOf('Page ') === -1) {
            newPage.footer.text = `${pageInd} • ${newPage.footer.text}`;
          }
        } else {
          newPage.footer.text = pageInd;
        }
      } else {
        newPage.footer = { text: pageInd };
      }
      return new EmbedBuilder(newPage);
    });
  }

  /**
   * Created a selection collector for selecting a page from the list.
   *   Must have 25 or fewer unique titles.
   * @param {CommandInteraction} interaction interaction to respond to
   * @param {Array<EmbedBuilder>} pages array of pages to make available
   * @param {CommandContext} ctx context for command call
   * @returns {Promise<void>}
   */
  static async selection(interaction, pages, ctx) {
    if (pages.length === 1) {
      const payload = { embeds: [pages[0]], flags: ctx.ephemerate ? this.MessageFlags.Ephemeral : 0 };
      return interaction.deferred || interaction.replied ? interaction.editReply(payload) : interaction.reply(payload);
    }
    let page = 1;
    const pagedPages = this.#shapePages(pages);
    const selections = pages.map((embed, index) => ({
      label: embed.title,
      value: `${index}`,
    }));

    const menu = () => [
      new ActionRowBuilder({
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

    const payload = {
      flags: ctx.ephemerate ? this.MessageFlags.Ephemeral : 0,
      embeds: [pagedPages[page - 1]],
      components: menu(),
    };
    const message =
      interaction.deferred || interaction.replied
        ? await interaction.editReply(payload)
        : await interaction.reply(payload);

    const collector = new InteractionCollector(interaction.client, {
      interactionType: InteractionType.MessageComponent,
      componentType: ComponentType.SelectMenu,
      message,
      guild: interaction.guild,
      channel: interaction.channel,
    });

    /**
     * Handle a new selection
     * @param {Discord.SelectMenuInteraction} selection updated selection
     * @returns {Promise<void>}
     */
    const selectionHandler = async (selection) => {
      await selection.deferUpdate({ flags: ctx.ephemerate ? this.MessageFlags.Ephemeral : 0 });
      page = Number.parseInt(selection.values[0], 10) + 1;
      if (page < 1) {
        page = 1;
      } else if (page > pagedPages.length) {
        page = pagedPages.length;
      }
      await interaction.editReply({
        embeds: [pagedPages[page - 1]],
        flags: ctx.ephemerate ? this.MessageFlags.Ephemeral : 0,
        components: menu(),
      });
    };
    collector.on('collect', selectionHandler);
    const blank = async () =>
      interaction.editReply({
        embeds: [pagedPages[page - 1]],
        flags: ctx.ephemerate ? this.MessageFlags.Ephemeral : 0,
        components: [],
      });
    collector.on('end', blank);
    collector.on('dispose', blank);
    return message;
  }

  /**
   * Create a paged interaction collector for an interaction & embed pages
   * @param {CommandInteraction} interaction to reply to
   * @param {Array<EmbedBuilder>} pages embed pages
   * @param {CommandContext} ctx command context
   * @returns {Promise<void>}
   */
  static async paged(interaction, pages, ctx) {
    if (!interaction.deferred)
      await interaction.deferReply({ flags: ctx.ephemerate ? this.MessageFlags.Ephemeral : 0 });
    let page = 1;
    if (pages.length === 1) {
      const payload = { embeds: [pages[0]], flags: ctx.ephemerate ? this.MessageFlags.Ephemeral : 0 };
      return interaction.deferred || interaction.replied ? interaction.editReply(payload) : interaction.reply(payload);
    }
    const pagedPages = this.#shapePages(pages);
    const embeds = [pagedPages[page - 1]];
    const message =
      interaction.deferred || interaction.replied
        ? await interaction.editReply({
            flags: ctx.ephemerate ? this.MessageFlags.Ephemeral : 0,
            embeds,
            components: this.#navComponents,
          })
        : await interaction.reply({
            flags: ctx.ephemerate ? this.MessageFlags.Ephemeral : 0,
            embeds,
            components: this.#navComponents,
          });

    const collector = new InteractionCollector(interaction.client, {
      interactionType: InteractionType.MessageComponent,
      componentType: ComponentType.Button,
      message,
      guild: interaction.guild,
      channel: interaction.channel,
    });

    /**
     * Handle button clicks
     * @param {Discord.ButtonInteraction} button to handle
     * @returns {Promise<void>}
     */
    const buttonHandler = async (button) => {
      await button?.deferUpdate({ flags: ctx.ephemerate ? this.MessageFlags.Ephemeral : 0 });
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
          await interaction.editReply({
            embeds: [pagedPages[page - 1]],
            flags: ctx.ephemerate ? this.MessageFlags.Ephemeral : 0,
            components: [],
          });
          return;
        default:
          break;
      }

      if (page < 1) {
        page = 1;
      } else if (page > pagedPages.length) {
        page = pagedPages.length;
      }
      await interaction.editReply({
        embeds: [pagedPages[page - 1]],
        flags: ctx.ephemerate ? this.MessageFlags.Ephemeral : 0,
        components: this.#navComponents,
      });
    };
    collector.on('collect', buttonHandler);
    collector.on('end', async (collected, reason) => ctx.logger.debug(`closed with ${reason}`));
    const blank = async () =>
      interaction.editReply({
        embeds: [pagedPages[page - 1]],
        flags: ctx.ephemerate ? this.MessageFlags.Ephemeral : 0,
        components: [],
      });
    collector.on('end', blank);
    collector.on('dispose', blank);
    return message;
  }

  static async confirmation(interaction, onConfirm, onDeny, ctx) {
    const message =
      interaction.deferred || interaction.replied
        ? await interaction.editReply({
            content: ctx.i18n`Are you sure?`,
            components: this.#confirmationComponents,
            flags: ctx.ephemerate ? this.MessageFlags.Ephemeral : 0,
          })
        : await interaction.reply({
            content: ctx.i18n`Are you sure?`,
            components: this.#confirmationComponents,
            flags: ctx.ephemerate ? this.MessageFlags.Ephemeral : 0,
          });

    const collector = new InteractionCollector(interaction.client, {
      interactionType: InteractionType.MessageComponent,
      componentType: ComponentType.Button,
      max: 1,
      message,
      guild: interaction.guild,
      channel: interaction.channel,
    });

    const bh = async (button) => {
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
    collector.on('end', (collected, reason) => ctx.logger.debug(`closed with ${reason}`));
  }
}
