import Discord from 'discord.js';

const {
  // eslint-disable-next-line no-unused-vars
  MessageEmbed, CommandInteraction, MessageButton, MessageActionRow,
  Constants: { MessageButtonStyles, InteractionTypes, MessageComponentTypes },
  InteractionCollector,
} = Discord;

export default class Collectors {
  static #navComponents = [
    new MessageActionRow({
      components: [
        new MessageButton({
          label: 'Previous',
          customId: 'previous',
          style: MessageButtonStyles.SECONDARY,
        }), new MessageButton({
          label: 'Stop',
          customId: 'stop',
          style: MessageButtonStyles.DANGER,
        }), new MessageButton({
          label: 'Next',
          customId: 'next',
          style: MessageButtonStyles.SECONDARY,
        }),
      ],
    }),
  ];
  static #confirmationComponents = [
    new MessageActionRow({
      components: [
        new MessageButton({
          label: 'yes',
          customId: 'confirm',
          style: MessageButtonStyles.PRIMARY,
        }), new MessageButton({
          label: 'no',
          customId: 'deny',
          style: MessageButtonStyles.SECONDARY,
        }),
      ],
    }),
  ];

  static async dynamic(interaction, pages, ctx) {
    return (pages?.length < 26
      ? this.selection(interaction, pages, ctx)
      : this.paged(interaction, pages, ctx));
  }

  /**
   * Created a selection collector for selecting a page from the list.
   *   Must have 25 or fewer unique titles.
   * @param {CommandInteraction} interaction interaction to respond to
   * @param {Array<MessageEmbed>} pages array of pages to make available
   * @param {CommandContext} ctx context for command call
   * @returns {Promise<void>}
   */
  static async selection(interaction, pages, ctx) {
    if (pages.length === 1) {
      const payload = { embeds: [pages[0]], ephemeral: ctx.ephemerate };
      return interaction.deferred || interaction.replied
        ? interaction.editReply(payload)
        : interaction.reply(payload);
    }
    let page = 1;
    const pagedPages = pages.map((newPage, index) => {
      const pageInd = `Page ${index + 1}/${pages.length}`;
      if (newPage.footer) {
        if (newPage instanceof MessageEmbed) {
          if (newPage.footer.text.indexOf('Page') === -1) {
            newPage.setFooter({ text: `${pageInd} • ${newPage.footer.text}`, iconURL: newPage.footer.iconURL });
          }
        } else if (newPage.footer.text) {
          if (newPage.footer.text.indexOf('Page') === -1) {
            newPage.footer.text = `${pageInd} • ${newPage.footer.text}`;
          }
        } else {
          newPage.footer.text = pageInd;
        }
      } else {
        newPage.footer = { text: pageInd };
      }
      return new MessageEmbed(newPage);
    });
    const selections = pages.map((embed, index) => ({
      label: embed.title,
      value: `${index}`,
    }));

    const menu = () => [new MessageActionRow({
      components: [
        new Discord.MessageSelectMenu({
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
    })];

    const payload = {
      ephemeral: ctx.ephemerate,
      embeds: [pagedPages[page - 1]],
      components: menu(),
    };
    const message = interaction.deferred || interaction.replied
      ? await interaction.editReply(payload)
      : await interaction.reply(payload);

    const collector = new InteractionCollector(interaction.client, {
      interactionType: InteractionTypes.MESSAGE_COMPONENT,
      componentType: MessageComponentTypes.SELECT_MENU,
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
      await selection.deferUpdate({ ephemeral: ctx.ephemerate });
      page = Number.parseInt(selection.values[0], 10) + 1;
      if (page < 1) {
        page = 1;
      } else if (page > pagedPages.length) {
        page = pagedPages.length;
      }
      await interaction.editReply({
        embeds: [pagedPages[page - 1]],
        ephemeral: ctx.ephemerate,
        components: menu(),
      });
    };
    collector.on('collect', selectionHandler);
    const blank = async () => interaction.editReply({
      embeds: [pagedPages[page - 1]],
      ephemeral: ctx.ephemerate,
      components: [],
    });
    collector.on('end', blank);
    collector.on('dispose', blank);
    return message;
  }

  /**
   * Create a paged interaction collector for an interaction & embed pages
   * @param {CommandInteraction} interaction to reply to
   * @param {Array<MessageEmbed>} pages embed pages
   * @param {CommandContext} ctx command context
   * @returns {Promise<void>}
   */
  static async paged(interaction, pages, ctx) {
    if (!interaction.deferred) await interaction.deferReply({ ephemeral: ctx.ephemerate });
    let page = 1;
    if (pages.length === 1) {
      const payload = { embeds: [pages[0]], ephemeral: ctx.ephemerate };
      return interaction.deferred || interaction.replied
        ? interaction.editReply(payload)
        : interaction.reply(payload);
    }
    const pagedPages = pages.map((newPage, index) => {
      const pageInd = `Page ${index + 1}/${pages.length}`;
      if (!newPage.description) newPage.setDescription('_ _');
      if (newPage.footer) {
        if (newPage instanceof MessageEmbed) {
          if (newPage.footer.text.indexOf('Page') === -1) {
            newPage.setFooter({ text: `${pageInd} • ${newPage.footer.text}`, iconURL: newPage.footer.iconURL });
          }
        } else if (newPage.footer.text) {
          if (newPage.footer.text.indexOf('Page') === -1) {
            newPage.footer.text = `${pageInd} • ${newPage.footer.text}`;
          }
        } else {
          newPage.footer.text = pageInd;
        }
      } else {
        newPage.footer = { text: pageInd };
      }
      return new MessageEmbed(newPage);
    });
    const embeds = [pagedPages[page - 1]];
    const message = interaction.deferred || interaction.replied
      ? await interaction.editReply({
        ephemeral: ctx.ephemerate,
        embeds,
        components: this.#navComponents,
      })
      : await interaction.reply({
        ephemeral: ctx.ephemerate,
        embeds,
        components: this.#navComponents,
      });

    const collector = new InteractionCollector(interaction.client, {
      interactionType: InteractionTypes.MESSAGE_COMPONENT,
      componentType: MessageComponentTypes.BUTTON,
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
      await button?.deferUpdate({ ephemeral: ctx.ephemerate });
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
            ephemeral: ctx.ephemerate,
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
        ephemeral: ctx.ephemerate,
        components: this.#navComponents,
      });
    };
    collector.on('collect', buttonHandler);
    collector.on('end', async (collected, reason) => ctx.logger.debug(`closed with ${reason}`));
    const blank = async () => interaction.editReply({
      embeds: [pagedPages[page - 1]],
      ephemeral: ctx.ephemerate,
      components: [],
    });
    collector.on('end', blank);
    collector.on('dispose', blank);
    return message;
  }

  static async confirmation(interaction, onConfirm, onDeny, ctx) {
    const message = interaction.deferred || interaction.replied
      ? await interaction.editReply({
        content: ctx.i18n`Are you sure?`,
        components: this.#confirmationComponents,
        ephemeral: ctx.ephemerate,
      })
      : await interaction.reply({
        content: ctx.i18n`Are you sure?`,
        components: this.#confirmationComponents,
        ephemeral: ctx.ephemerate,
      });

    const collector = new InteractionCollector(interaction.client, {
      interactionType: InteractionTypes.MESSAGE_COMPONENT,
      componentType: MessageComponentTypes.BUTTON,
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
