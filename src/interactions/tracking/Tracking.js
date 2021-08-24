'use strict';

const Discord = require('discord.js');

const {
  Constants: {
    ApplicationCommandOptionTypes: Types, InteractionTypes,
    MessageComponentTypes, MessageButtonStyles,
  },
  MessageActionRow, MessageSelectMenu, InteractionCollector,
} = Discord;
const { MessageButton } = require('discord.js');
const {
  chunkify, trackableEvents, toTitleCase, trackableItems,
} = require('../../CommonFunctions');

/**
 * Generate tracking message strings
 * @param {TrackingOptions} track tracking options
 * @returns {Array<string>}
 */
const chunkerate = (track) => {
  const itemString = !track.items.length ? 'None' : track.items.map(i => `\`${i}\``).join(', ');
  const eventString = !track.events.length ? 'None' : track.events.map(m => `\`${m}\``).join(', ');
  const format = `**Current Items:**\n${itemString}\n\n**Current Events:**\n${eventString}`;
  return chunkify({ string: format, maxLength: 2000 });
};

module.exports = class Settings extends require('../../models/Interaction') {
  static elevated = true;
  static command = {
    name: 'tracking',
    description: 'Configure tracking options',
    defaultPermission: false,
    options: [{
      name: 'manage',
      type: Types.SUB_COMMAND,
      description: 'Manage tracking settings',
    }, {
      name: 'pings',
      type: Types.SUB_COMMAND,
      description: 'Set up pings',
    }],
  }

  static async commandHandler(interaction, ctx) {
    const { options } = interaction;
    const action = options?.getSubcommand();
    if (action === 'manage') {
      await interaction.deferReply();
      const original = Object.freeze({
        items: await ctx.settings.getTrackedItems(interaction.channel),
        events: await ctx.settings.getTrackedEventTypes(interaction.channel),
      });
      const current = { ...original };
      let chunks = chunkerate(current);
      let page = 0;

      let currentGroup;
      const createGroupsRow = () => {
        const groups = [
          {
            label: 'Items',
            value: 'items',
            default: currentGroup === 'items',
          },
          ...(Object.keys(trackableEvents)
            .filter(e => !['events', 'opts', 'kuva', 'twitter', 'arbitration', 'cetus'].includes(e)
              && !e.startsWith('fissures')
              && !e.startsWith('twitter')
              && !e.startsWith('arbitration'))
            .map(e => ({
              label: e === 'baseEvents' ? toTitleCase('events') : toTitleCase(e.split('.').join(' ')),
              value: e,
              default: currentGroup === e,
            }))),
        ];
        ctx.logger.silly(`groups: ${JSON.stringify(groups)}`);
        // eslint-disable-next-line no-nested-ternary
        const groupOptions = currentGroup ? (
          currentGroup === 'items'
            ? trackableItems.items.map(i => ({
              label: toTitleCase(i.split('.').join(' ')),
              value: i,
              default: current.items.includes(i),
            }))
            : trackableEvents[currentGroup].map(e => ({
              label: toTitleCase(e.split('.').join(' ')),
              value: e,
              default: current.events.includes(e),
            })))
          : [{ label: 'N/A', value: 'na', default: false }];
        ctx.logger.silly(`groupOptions: ${JSON.stringify(groupOptions)}`);
        return ([
          new MessageActionRow({
            components: [
              new MessageButton({
                label: 'Previous',
                customId: 'previous',
                style: MessageButtonStyles.SECONDARY,
                disabled: chunks.length > 0,
              }),
              new MessageButton({
                label: 'Next',
                customId: 'next',
                style: MessageButtonStyles.SECONDARY,
                disabled: chunks.length > 0,
              }),
            ],
          }),
          new MessageActionRow({
            components: [
              new MessageSelectMenu({
                minValues: 0,
                maxValues: 1,
                customId: 'select_group',
                placeholder: ctx.i18n`Select Tracking Group`,
                options: groups,
              }),
            ],
          }),
          new MessageActionRow({
            components: [
              new MessageSelectMenu({
                maxValues: groupOptions.length,
                customId: 'select_trackables',
                placeholder: ctx.i18n`Select Trackables`,
                options: groupOptions,
                disabled: !currentGroup,
              }),
            ],
          }),
          new MessageActionRow({
            components: [
              new MessageButton({
                label: 'Save',
                customId: 'save',
                style: MessageButtonStyles.PRIMARY,
              }),
              new MessageButton({
                label: 'All',
                customId: 'all',
                style: MessageButtonStyles.PRIMARY,
              }),
              new MessageButton({
                label: 'Reset',
                customId: 'reset',
                style: MessageButtonStyles.SECONDARY,
              }),
              new MessageButton({
                label: 'Cancel',
                customId: 'cancel',
                style: MessageButtonStyles.SECONDARY,
              }),
              new MessageButton({
                label: 'Clear',
                customId: 'clear',
                style: MessageButtonStyles.DANGER,
              }),
            ],
          }),
        ]);
      };
      const message = await interaction.editReply({
        content: chunks[page],
        components: createGroupsRow(),
      });

      const groupCollector = new InteractionCollector(interaction.client, {
        interactionType: InteractionTypes.MESSAGE_COMPONENT,
        componentType: MessageComponentTypes.SELECT_MENU,
        message,
        guild: interaction.guild,
        channel: interaction.channel,
      });
      /**
       * Interaction handler for the group selection menu
       * @param {Discord.SelectMenuInteraction} selection interaction
       * @returns {Promise<void>}
       */
      const groupSelectionHandler = async (selection) => {
        await selection.deferUpdate();
        switch (selection.customId) {
          case 'select_group':
            [currentGroup] = selection.values;
            await message.edit({
              content: chunks[page],
              components: createGroupsRow(),
            });
            break;
          case 'select_trackables':
            if (currentGroup === 'items') {
              current.items = current.items.filter(i => !trackableItems.items.includes(i));
              current.items = [...selection.values];
            } else {
              current.events = current.events
                .filter(e => !trackableEvents[currentGroup].includes(e));
              current.events.push(...selection.values);
            }
            chunks = chunkerate(current);
            if (chunks.length - 1) {
              page = 0;
            }
            await message.edit({
              content: chunks[page],
              components: createGroupsRow(),
            });
            break;
          default:
            break;
        }
      };
      groupCollector.on('collect', groupSelectionHandler);

      const buttonCollector = new InteractionCollector(interaction.client, {
        interactionType: InteractionTypes.MESSAGE_COMPONENT,
        componentType: MessageComponentTypes.BUTTON,
        message,
        guild: interaction.guild,
        channel: interaction.channel,
      });
      /**
       * Handle the buttons!
       * @param {Discord.ButtonInteraction} button button interaction to handle
       * @returns {Promise<null|*>}
       */
      const buttonHandler = async (button) => {
        await button.deferUpdate();
        switch (button.customId) {
          case 'save':
            await ctx.settings.setTrackables(interaction.channel, current);
            buttonCollector.stop('limit');
            return message.edit({
              content: chunks[page],
              components: [
                new MessageActionRow({
                  components: [
                    new MessageButton({
                      style: MessageButtonStyles.SUCCESS,
                      customId: 'success',
                      label: 'Tracking Saved!',
                      disabled: true,
                    }),
                  ],
                }),
              ],
            });
          case 'cancel':
            currentGroup = null;
            current.events = original.events;
            current.items = original.items;
            chunks = chunkerate(current);
            if (page > chunks.length - 1) page = 0;
            return message.edit({
              content: chunks[page],
              components: [
                new MessageActionRow({
                  components: [
                    new MessageButton({
                      label: 'Canceled',
                      customId: 'done',
                      disabled: true,
                      style: MessageButtonStyles.SUCCESS,
                    }),
                  ],
                }),
              ],
            });
          case 'clear':
            current.events = [];
            current.items = [];
            currentGroup = null;
            chunks = chunkerate(current);
            if (page > chunks.length - 1) page = 0;
            return message.edit({
              content: chunks[page],
              components: createGroupsRow(),
            });
          case 'reset':
            current.events = original.events;
            current.items = original.items;
            chunks = chunkerate(current);
            if (chunks.length - 1 > page) page = 0;
            await message.edit({
              content: chunks[page],
              components: createGroupsRow(),
            });
            break;
          case 'all':
            if (currentGroup === 'items') current.items = trackableItems.items;
            else {
              current.events = Array
                .from(new Set(current.events.concat(trackableEvents[currentGroup])));
            }
            chunks = chunkerate(current);
            if (page > chunks.length - 1) page = 0;
            break;
          case 'previous':
            if (page > 0) page -= 1;
            break;
          case 'next':
            if (page <= chunks.length - 1) page += 1;
            break;
          case 'first':
            page = 0;
            break;
          case 'last':
            page = chunks.length - 1;
            break;
          default:
            break;
        }
        await message.edit({
          content: chunks[page],
          components: createGroupsRow(),
        });
        return null;
      };
      buttonCollector.on('collect', buttonHandler);
    }
  }
};
