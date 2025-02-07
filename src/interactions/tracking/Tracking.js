import {
  ApplicationCommandOptionType,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  InteractionCollector,
  PermissionsBitField,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  Utils,
  ChannelType,
} from 'discord.js';

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

/**
 * Generate tracking message strings
 * @param {TrackingOptions} track tracking options
 * @returns {Array<string>}
 */
const chunkerate = (track) => {
  const itemString = !track.items.length ? 'None' : track.items.map((i) => `\`${i}\``).join(', ');
  const eventString = !track.events.length ? 'None' : track.events.map((m) => `\`${m}\``).join(', ');
  const format = `**Current Items:**\n${itemString}\n\n**Current Events:**\n${eventString}`;
  return chunkify({ string: format, maxLength: 500, breakChar: ',' });
};

const subgrouped = ['arbitration', 'fissures', 'twitter', 'fissures.sp'];

export default class Tracking extends Interaction {
  static elevated = true;
  static command = {
    ...cmds.tracking,
    defaultMemberPermissions: PermissionsBitField.Flags.ManageGuild,
    options: [
      {
        ...cmds['tracking.manage'],
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            ...cmds['tracking.manage.channel'],
            type: ApplicationCommandOptionType.Channel,
          },
          {
            ...cmds['tracking.manage.thread'],
            type: ApplicationCommandOptionType.Channel,
          },
        ],
      },
      {
        ...cmds['tracking.custom'],
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            ...cmds['tracking.custom.add'],
            type: ApplicationCommandOptionType.String,
          },
          {
            ...cmds['tracking.custom.remove'],
            type: ApplicationCommandOptionType.String,
          },
          {
            ...cmds['tracking.custom.prepend'],
            type: ApplicationCommandOptionType.String,
          },
          {
            ...cmds['tracking.custom.channel'],
            type: ApplicationCommandOptionType.Channel,
          },
          {
            ...cmds['tracking.custom.clear-prepend'],
            type: ApplicationCommandOptionType.Boolean,
          },
          {
            ...cmds['tracking.custom.thread'],
            type: ApplicationCommandOptionType.Channel,
          },
        ],
      },
    ],
  };

  static async commandHandler(interaction, ctx) {
    await interaction?.deferReply({ ephemeral: false });
    const { options } = interaction;
    const action = options?.getSubcommand();
    let channel;
    let thread;
    let isThread;
    if (options?.getChannel('channel')) {
      if (options?.getChannel('channel').type !== ChannelType.GuildText) {
        return interaction.editReply({
          ephemeral: ctx.ephemerate,
          content: `:warning: ${options.getChannel('channel')} is not a text channel. :warning:`,
        });
      }
      channel = options.getChannel('channel');
    }
    if (!channel) {
      isThread = interaction.channel.isThread();
      channel = isThread ? interaction.channel.parent : interaction.channel;
      thread = isThread ? interaction.channel : undefined;
    }
    if (options.getChannel('thread')?.isThread?.()) {
      thread = options.getChannel('thread');
      if (thread.parent.id !== channel.id) {
        return interaction.editReply({
          ephemeral: ctx.ephemerate,
          content: `:warning: ${thread} is not a thread in ${channel} :warning:`,
        });
      }
    } else if (options.getChannel('thread')) {
      return interaction.editReply({
        ephemeral: ctx.ephemerate,
        content: `:warning: ${options.getChannel('thread')} is not a thread channel :warning:`,
      });
    }
    if (action === 'manage') {
      const original = Object.freeze({
        items: await ctx.settings.getTrackedItems(channel, thread),
        events: await ctx.settings.getTrackedEventTypes(channel, thread),
      });
      const current = JSON.parse(JSON.stringify(original));
      current.thread = thread;
      let chunks = chunkerate(current);
      let page = 0;

      let currentGroup;
      let currentSubgroup;

      const titleGroup = (groupId) => {
        switch (groupId) {
          case 'baseEvents':
            return 'Events';
          case 'fissures.sp':
            return 'Steel Path Fissures';
          default:
            return toTitleCase(groupId.split('.').join(' '));
        }
      };
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
                (!['events', 'opts', 'kuva', 'cetus'].includes(e) &&
                  !e.startsWith('fissures.') &&
                  !e.startsWith('twitter.') &&
                  !e.startsWith('arbitration.')) ||
                e === 'fissures.sp'
            )
            .map((e) => ({
              label: titleGroup(e),
              value: e,
              default: currentGroup === e,
            })),
        ];
        const subgroups = subgrouped.includes(currentGroup)
          ? Object.keys(trackableEvents)
              .filter((e) => {
                return (
                  e.startsWith(`${currentGroup}.`) &&
                  (currentGroup === 'fissures' ? !e.startsWith('fissures.sp') : true)
                );
              })
              .map((e) => ({
                label: titleGroup(e),
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
                    label: titleGroup(li),
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
            ? new ActionRowBuilder({
                components: [
                  new ButtonBuilder({
                    label: 'Previous',
                    customId: 'previous',
                    style: ButtonStyle.Secondary,
                    disabled: chunks.length < 1,
                  }),
                  new ButtonBuilder({
                    label: 'Next',
                    customId: 'next',
                    style: ButtonStyle.Secondary,
                    disabled: chunks.length < 1,
                  }),
                ],
              })
            : undefined,
          // group selection
          groups?.length
            ? new ActionRowBuilder({
                components: [
                  new StringSelectMenuBuilder({
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
            ? new ActionRowBuilder({
                components: [
                  new StringSelectMenuBuilder({
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
            ? new ActionRowBuilder({
                components: [
                  new StringSelectMenuBuilder({
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
          new ActionRowBuilder({
            components: [
              new ButtonBuilder({
                label: 'Save',
                customId: 'save',
                style: ButtonStyle.Primary,
              }),
              new ButtonBuilder({
                label: 'All',
                customId: 'all',
                style: ButtonStyle.Primary,
              }),
              new ButtonBuilder({
                label: 'Reset',
                customId: 'reset',
                style: ButtonStyle.Secondary,
              }),
              new ButtonBuilder({
                label: 'Cancel',
                customId: 'cancel',
                style: ButtonStyle.Secondary,
              }),
              new ButtonBuilder({
                label: 'Clear',
                customId: 'clear',
                style: ButtonStyle.Danger,
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
        interactionType: interaction.MESSAGE_COMPONENT,
        componentType: ComponentType.StringSelect,
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
        interactionType: interaction.MESSAGE_COMPONENT,
        componentType: ComponentType.Button,
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
            await ctx.settings.setTrackables(channel, current);
            buttonCollector.stop('limit');
            await this.#generateWebhook(interaction, ctx, channel);
            return message.edit({
              content: chunks[page],
              components: [
                new ActionRowBuilder({
                  components: [
                    new ButtonBuilder({
                      style: ButtonStyle.Success,
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
                new ActionRowBuilder({
                  components: [
                    new ButtonBuilder({
                      label: 'Canceled',
                      customId: 'done',
                      disabled: true,
                      style: ButtonStyle.Success,
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
        if (page > chunks.length - 1) page = chunks.length - 1;
        if (page < 0) page = 0;
        if (chunks[page]) {
          return message.edit({
            content: chunks[page],
            components: createGroupsRow(),
          });
        }
        if (chunks[page - 1]) {
          page -= 1;
        } else if (chunks[page + 1]) {
          page += 1;
        } else if (chunks[0]) {
          page = 0;
        }
        if (chunks[page]) {
          return message.edit({
            content: chunks[page],
            components: createGroupsRow(),
          });
        }
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
      if (add?.events?.length) await ctx.settings.trackEventTypes(channel, add.events, thread);
      if (add?.items?.length) await ctx.settings.trackItems(channel, add.items, thread);
      const addString = ctx.i18n`Added ${add?.events?.length || 0} events, ${add?.items?.length || 0} items`;
      if (remove?.events?.length) await ctx.settings.untrackEventTypes(channel, remove.events, thread);
      if (remove?.items?.length && !clear) await ctx.settings.untrackItems(channel, remove.items, thread);
      const removeString = ctx.i18n`Removed ${remove?.events?.length} events, ${remove?.items?.length} items`;
      await interaction.editReply({ content: `${addString}\n${removeString}`, ephemeral: ctx.ephemerate });

      if (prepend && (add.items.length || add.events.length)) {
        await ctx.settings.addPings(interaction.guild, add, prepend);
        const pingsString = ctx.i18n`Adding \`${Utils.escapeMarkdown(
          Utils.removeMentions(prepend)
        )}\` for ${add?.events?.length || 0} events, ${add?.items?.length || 0} items`;
        await interaction.editReply({
          ephemeral: ctx.ephemerate,
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
   * @param {Discord.ThreadChannel} [thread] to post to
   */
  static async #generateWebhook(interaction, ctx, channel, thread) {
    channel = channel || interaction.channel;
    if (channel.permissionsFor(interaction.client.user).has(PermissionsBitField.Flags.ManageWebhooks)) {
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
          webhook = await channel.createWebhook({
            name: ctx.settings.defaults.username,
            avatar: ctx.settings.defaults.avatar,
            reason: 'Automated Webhook setup for Notifications',
          });
        } catch (e) {
          ctx.logger.error(e);
          await interaction.followUp(`${emojify('red_tick')} Cannot set up webhooks: failed to make new.`);
        }
      }
      if (!webhook) {
        return interaction.followUp(`${emojify('red_tick')} Cannot set up webhooks: this should not happen.`);
      }
      if (webhook?.url) {
        try {
          await interaction.followUp(`${emojify('green_tick')} Webhook setup complete.`);
          await webhook.send({
            content: ':diamond_shape_with_a_dot_inside: Webhook initialized',
            threadId: thread?.id,
          });
          if (!webhook.avatar.startsWith('http')) webhook.avatar = ctx.settings.defaults.avatar;
        } catch (e) {
          ctx.logger.error(e);
          await interaction.followUp(`${emojify('red_tick')} Cannot set up webhooks: failed to send.`);
        }
      } else {
        ctx.logger.debug(`webhook for ${channel.id} already set up...`);
        ctx.logger.debug(JSON.stringify(webhook));
      }
      await ctx.settings.setChannelWebhook(channel, webhook);
    } else {
      await interaction.followUp(`${emojify('red_tick')} Cannot set up webhooks: missing permissions.`);
    }
    const upd = await interaction.followUp(`${emojify('empty')} Checking channel...`);
    try {
      ctx.settings.checkUpdateChannel(channel);
      await upd.edit(`${emojify('green_tick')} Channel checked`);
      setTimeout(async () => upd.delete(), 10000);
    } catch (e) {
      ctx.logger.error(e);
      await upd.edit(`${emojify('red_tick')} Channel check failed, contact support`);
    }
  }
}
