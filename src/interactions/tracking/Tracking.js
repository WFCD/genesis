import Discord, { MessageButton } from 'discord.js';
import Interaction from '../../models/Interaction.js';
import {
  chunkify,
  emojify,
  toTitleCase,
  trackableEvents,
  trackableItems,
  trackablesFromParameters,
} from '../../utilities/CommonFunctions.js';
import { cmds } from '../../resources/index.js';

const {
  Constants: { ApplicationCommandOptionTypes: Types, InteractionTypes, MessageComponentTypes, MessageButtonStyles },
  MessageActionRow,
  MessageSelectMenu,
  InteractionCollector,
} = Discord;

/**
 * Generate tracking message strings
 * @param {TrackingOptions} track tracking options
 * @returns {Array<string>}
 */
const chunkerate = (track) => {
  const itemString = !track.items.length ? 'None' : track.items.map((i) => `\`${i}\``).join(', ');
  const eventString = !track.events.length ? 'None' : track.events.map((m) => `\`${m}\``).join(', ');
  const format = `**Current Items:**\n${itemString}\n\n**Current Events:**\n${eventString}`;
  return chunkify({ string: format, maxLength: 2000, breakChar: ',' });
};

const subgrouped = ['arbitration', 'fissures', 'twitter'];

export default class Settings extends Interaction {
  static elevated = true;
  static command = {
    ...cmds.tracking,
    // defaultPermission: false,
    options: [
      {
        ...cmds['tracking.manage'],
        type: Types.SUB_COMMAND,
      },
      {
        ...cmds['tracking.custom'],
        type: Types.SUB_COMMAND,
        options: [
          {
            ...cmds['tracking.custom.add'],
            type: Types.STRING,
          },
          {
            ...cmds['tracking.custom.remove'],
            type: Types.STRING,
          },
          {
            ...cmds['tracking.custom.prepend'],
            type: Types.STRING,
          },
          {
            ...cmds['tracking.custom.channel'],
            type: Types.CHANNEL,
          },
          {
            ...cmds['tracking.custom.clear-prepend'],
            type: Types.BOOLEAN,
          },
        ],
      },
    ],
  };

  static async commandHandler(interaction, ctx) {
    await interaction?.deferReply({ ephemeral: false });
    const { options } = interaction;
    const action = options?.getSubcommand();
    if (action === 'manage') {
      const original = Object.freeze({
        items: await ctx.settings.getTrackedItems(interaction.channel),
        events: await ctx.settings.getTrackedEventTypes(interaction.channel),
      });
      const current = { ...original };
      let chunks = chunkerate(current);
      let page = 0;

      let currentGroup;
      let currentSubgroup;
      const createGroupsRow = () => {
        const groups = [
          {
            label: 'Items',
            value: 'items',
            default: currentGroup === 'items',
          },
          ...Object.keys(trackableEvents)
            .filter(
              (e) =>
                !['events', 'opts', 'kuva', 'cetus'].includes(e) &&
                !e.startsWith('fissures.') &&
                !e.startsWith('twitter.') &&
                !e.startsWith('arbitration.')
            )
            .map((e) => ({
              label: e === 'baseEvents' ? toTitleCase('events') : toTitleCase(e.split('.').join(' ')),
              value: e,
              default: currentGroup === e,
            })),
        ];
        const subgroups = subgrouped.includes(currentGroup)
          ? Object.keys(trackableEvents)
              .filter((e) => e.startsWith(`${currentGroup}.`))
              .map((e) => ({
                label: toTitleCase(e.split('.').join(' ')),
                value: e,
                default: currentSubgroup === e,
              }))
          : undefined;

        const currentDetermination =
          subgrouped.includes(currentGroup) && !currentSubgroup ? undefined : currentSubgroup || currentGroup;

        const list = currentDetermination === 'items' ? trackableItems.items : trackableEvents[currentDetermination];
        const groupOptions = list?.length
          ? list
              .map((li, index) => {
                if (index < 25) {
                  return {
                    label: toTitleCase(li.split('.').join(' ')),
                    value: li,
                    default: current.items.includes(li) || current.events.includes(li),
                  };
                }
                return undefined;
              })
              .filter((a) => a)
          : [{ label: 'N/A', value: 'na', default: false }];
        return [
          // paginator
          chunks.length > 1
            ? new MessageActionRow({
                components: [
                  new MessageButton({
                    label: 'Previous',
                    customId: 'previous',
                    style: MessageButtonStyles.SECONDARY,
                    disabled: chunks.length < 1,
                  }),
                  new MessageButton({
                    label: 'Next',
                    customId: 'next',
                    style: MessageButtonStyles.SECONDARY,
                    disabled: chunks.length < 1,
                  }),
                ],
              })
            : undefined,
          // group selection
          groups?.length
            ? new MessageActionRow({
                components: [
                  new MessageSelectMenu({
                    minValues: 0,
                    maxValues: 1,
                    customId: 'select_group',
                    placeholder: ctx.i18n`Select Tracking Group`,
                    options: groups,
                  }),
                ],
              })
            : undefined,
          // subgroup selection
          subgrouped.includes(currentGroup)
            ? new MessageActionRow({
                components: [
                  new MessageSelectMenu({
                    minValues: 0,
                    maxValues: 1,
                    customId: 'select_sub_group',
                    placeholder: ctx.i18n`Select Tracking Sub-Group`,
                    options: subgroups,
                  }),
                ],
              })
            : undefined,
          // discrete trackable selection
          groupOptions.length
            ? new MessageActionRow({
                components: [
                  new MessageSelectMenu({
                    maxValues: groupOptions.length,
                    customId: 'select_trackables',
                    placeholder: ctx.i18n`Select Trackables`,
                    options: groupOptions,
                    disabled: !currentDetermination,
                  }),
                ],
              })
            : undefined,
          // actions (save, all, reset, cancel, clear)
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
        ].filter((a) => a);
      };
      const message = await interaction.editReply({
        content: chunks[page],
        components: createGroupsRow(),
        ephemeral: false,
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
            currentSubgroup = undefined;
            await message.edit({
              content: chunks[page],
              components: createGroupsRow(),
            });
            break;
          case 'select_sub_group':
            [currentSubgroup] = selection.values;
            await message.edit({
              content: chunks[page],
              components: createGroupsRow(),
            });
            break;
          case 'select_trackables':
            if (currentGroup === 'items') {
              current.items = current.items.filter((i) => !trackableItems.items.includes(i));
              current.items = [...selection.values];
            } else {
              current.events = current.events.filter(
                (e) => !trackableEvents[currentSubgroup || currentGroup].includes(e)
              );
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
       * @returns {Promise<undefined|*>}
       */
      const buttonHandler = async (button) => {
        await button?.deferUpdate();
        switch (button?.customId) {
          case 'save':
            await ctx.settings.setTrackables(interaction.channel, current);
            buttonCollector.stop('limit');
            await this.#generateWebhook(interaction, ctx);
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
            currentGroup = undefined;
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
            currentGroup = undefined;
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
              current.events = Array.from(
                new Set(current.events.concat(trackableEvents[currentSubgroup || currentGroup]))
              );
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
        return undefined;
      };
      buttonCollector.on('collect', buttonHandler);
    }
    if (action === 'custom') {
      await interaction?.editReply({ content: 'Analyzing...', ephemeral: ctx.ephemerate });
      const add = trackablesFromParameters(
        (options.getString('add') || '')
          .split(',')
          .map((a) => a?.trim())
          .filter(Boolean)
      );
      const remove = trackablesFromParameters(
        (options.getString('remove') || '')
          .split(',')
          .map((a) => a?.trim())
          .filter(Boolean)
      );
      const prepend = options.getString('prepend');
      const clear = options.getBoolean('clear-prepend');
      const channel =
        options?.getChannel('channel')?.type === 'GUILD_TEXT' ? options.getChannel('channel') : interaction.channel;

      if (clear && Object.keys(remove)?.length) {
        await Promise.all(
          Object.keys(remove).map(async (type) =>
            Promise.all(remove[type].map(async (unping) => ctx.settings.removePing(interaction.guild, unping)))
          )
        );
        return interaction?.editReply?.({
          content: ctx.i18n`Removed pings for ${remove.events.length + remove.items.length} trackables.`,
          ephemeral: ctx.ephemerate,
        });
      }
      if (clear && !remove?.length) {
        return interaction?.editReply?.({
          content: ctx.i18n`Specify trackables to remove the prepend for.`,
          ephemeral: ctx.ephemerate,
        });
      }
      if (add?.events?.length) await ctx.settings.trackEventTypes(channel, add.events);
      if (add?.items?.length) await ctx.settings.trackItems(channel, add.items);
      const addString = ctx.i18n`Added ${add?.events?.length || 0} events, ${add?.items?.length || 0} items`;
      if (remove?.events?.length) await ctx.settings.untrackEventTypes(channel, remove.events);
      if (remove?.items?.length && !clear) await ctx.settings.untrackItems(channel, remove.items);
      const removeString = ctx.i18n`Removed ${remove?.events?.length} events, ${remove?.items?.length} items`;
      await interaction.editReply({ content: `${addString}\n${removeString}`, ephemeral: ctx.ephemerate });

      if (prepend && (add.items.length || add.events.length)) {
        await ctx.settings.addPings(interaction.guild, add, prepend);
        const pingsString = ctx.i18n`Adding \`${Discord.Util.escapeMarkdown(
          Discord.Util.removeMentions(prepend)
        )}\` for ${add?.events?.length || 0} events, ${add?.items?.length || 0} items`;
        await interaction.editReply({
          content: `${addString}\n${removeString}\n${pingsString}`,
        });
      }
      await this.#generateWebhook(interaction, ctx, channel);
    }
  }

  /**
   * Generate webhook for channel
   * @param {Discord.CommandInteraction} interaction message containing channel context
   * @param {CommandContext} ctx to set up everything
   * @param {Discord.TextChannel} [channel] to set up
   */
  static async #generateWebhook(interaction, ctx, channel) {
    channel = channel || interaction.channel;
    if (channel.permissionsFor(interaction.client.user).has('MANAGE_WEBHOOKS')) {
      let webhook;
      let existingWebhooks;
      let setupMsg;
      try {
        setupMsg = await interaction.followUp({
          content: 'Setting up webhook...',
        });
        existingWebhooks = (await channel.fetchWebhooks()).filter(
          (w) => w.type === 'Incoming' && w?.owner?.id === interaction?.client?.user?.id && !!w.token
        );
      } catch (e) {
        ctx.logger.error(e);
        await interaction.followUp(`${emojify('red_tick')} Cannot set up webhooks: failed to get existing.`);
      }

      if (existingWebhooks.size) {
        const temp = existingWebhooks.first();
        webhook = {
          id: temp.id,
          token: temp.token,
          name: ctx.settings.defaults.username,
          avatar: ctx.settings.defaults.avatar,
        };
        try {
          await setupMsg.delete();
        } catch (e) {
          ctx.logger.error(e);
        }
      } else {
        try {
          webhook = await channel.createWebhook(ctx.settings.defaults.username, {
            avatar: ctx.settings.defaults.avatar,
            reason: 'Automated Webhook setup for Notifications',
          });
        } catch (e) {
          ctx.logger.error(e);
          await interaction.followUp(`${emojify('red_tick')} Cannot set up webhooks: failed to make new.`);
        }
      }
      if (webhook.url) {
        try {
          await interaction.followUp(`${emojify('green_tick')} Webhook setup complete.`);
          await webhook.send(':diamond_shape_with_a_dot_inside: Webhook initialized');
          if (!webhook.avatar.startsWith('http')) webhook.avatar = ctx.settings.defaults.avatar;
        } catch (e) {
          ctx.logger.error(e);
          await interaction.followUp(`${emojify('red_tick')} Cannot set up webhooks: failed to send.`);
        }
      } else {
        ctx.logger.debug(`webhook for ${channel.id} already set up...`);
      }
      await ctx.settings.setChannelWebhook(channel, webhook);
    } else {
      await interaction.followUp(`${emojify('red_tick')} Cannot set up webhooks: missing permissions.`);
    }
  }
}
