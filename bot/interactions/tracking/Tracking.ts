import { ApplicationCommandOptionType as Types, ChannelType, escapeMarkdown, PermissionFlagsBits } from 'discord.js';

const stripMentions = (text: string) => text.replace(/@/g, '@\u200b');

import { emojify, trackablesFromParameters, withEphemeral } from '#shared/utilities/CommonFunctions';
import { cmds } from '#shared/resources/index';

import Interaction from '../../models/Interaction';

import TrackingManageUI from './TrackingManageUI';

export default class Tracking extends Interaction {
  static elevated = true;
  static command = {
    ...cmds.tracking,
    defaultMemberPermissions: PermissionFlagsBits.ManageGuild,
    options: [
      {
        ...cmds['tracking.manage'],
        type: Types.Subcommand,
        options: [
          {
            ...cmds['tracking.manage.channel'],
            type: Types.Channel,
          },
          {
            ...cmds['tracking.manage.thread'],
            type: Types.Channel,
          },
        ],
      },
      {
        ...cmds['tracking.custom'],
        type: Types.Subcommand,
        options: [
          {
            ...cmds['tracking.custom.add'],
            type: Types.String,
          },
          {
            ...cmds['tracking.custom.remove'],
            type: Types.String,
          },
          {
            ...cmds['tracking.custom.prepend'],
            type: Types.String,
          },
          {
            ...cmds['tracking.custom.channel'],
            type: Types.Channel,
          },
          {
            ...cmds['tracking.custom.clear-prepend'],
            type: Types.Boolean,
          },
          {
            ...cmds['tracking.custom.thread'],
            type: Types.Channel,
          },
        ],
      },
    ],
  };

  static async commandHandler(interaction, ctx) {
    const { options } = interaction;
    const action = options?.getSubcommand();
    let channel;
    let thread;
    let isThread;
    if (options?.getChannel('channel')) {
      if (options?.getChannel('channel').type !== ChannelType.GuildText) {
        if (action === 'manage') {
          return interaction.reply(
            withEphemeral(ctx.ephemerate, {
              content: `:warning: ${options.getChannel('channel')} is not a text channel. :warning:`,
            })
          );
        }
        await interaction.deferReply(withEphemeral(ctx.ephemerate));
        return interaction.editReply(
          withEphemeral(ctx.ephemerate, {
            content: `:warning: ${options.getChannel('channel')} is not a text channel. :warning:`,
          })
        );
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
        if (action === 'manage') {
          return interaction.reply(
            withEphemeral(ctx.ephemerate, { content: `:warning: ${thread} is not a thread in ${channel} :warning:` })
          );
        }
        await interaction.deferReply(withEphemeral(ctx.ephemerate));
        return interaction.editReply(
          withEphemeral(ctx.ephemerate, { content: `:warning: ${thread} is not a thread in ${channel} :warning:` })
        );
      }
    } else if (options.getChannel('thread')) {
      if (action === 'manage') {
        return interaction.reply(
          withEphemeral(ctx.ephemerate, {
            content: `:warning: ${options.getChannel('thread')} is not a thread channel :warning:`,
          })
        );
      }
      await interaction.deferReply(withEphemeral(ctx.ephemerate));
      return interaction.editReply(
        withEphemeral(ctx.ephemerate, {
          content: `:warning: ${options.getChannel('thread')} is not a thread channel :warning:`,
        })
      );
    }
    if (action === 'manage') {
      return TrackingManageUI.start(interaction, ctx, channel, thread);
    }

    await interaction.deferReply(withEphemeral(ctx.ephemerate));

    if (action === 'custom') {
      await interaction?.editReply(withEphemeral(ctx.ephemerate, { content: 'Analyzing...' }));
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
            Promise.all(
              remove[type].map(async (unping) => ctx.settings.notifications.removePing(interaction.guild, unping))
            )
          )
        );
        return interaction?.editReply?.(
          withEphemeral(ctx.ephemerate, {
            content: ctx.i18n`Removed pings for ${remove.events.length + remove.items.length} trackables.`,
          })
        );
      }
      if (clear && !Object.keys(remove).length) {
        return interaction?.editReply?.(
          withEphemeral(ctx.ephemerate, {
            content: ctx.i18n`Specify trackables to remove the prepend for.`,
          })
        );
      }
      if (add?.events?.length) await ctx.settings.tracking.trackEventTypes(channel, add.events, thread);
      if (add?.items?.length) await ctx.settings.tracking.trackItems(channel, add.items, thread);
      const addString = ctx.i18n`Added ${add?.events?.length || 0} events, ${add?.items?.length || 0} items`;
      if (remove?.events?.length) await ctx.settings.tracking.untrackEventTypes(channel, remove.events, thread);
      if (remove?.items?.length && !clear) await ctx.settings.tracking.untrackItems(channel, remove.items, thread);
      const removeString = ctx.i18n`Removed ${remove?.events?.length} events, ${remove?.items?.length} items`;
      await interaction.editReply(withEphemeral(ctx.ephemerate, { content: `${addString}\n${removeString}` }));

      if (prepend && (add.items.length || add.events.length)) {
        await ctx.settings.notifications.addPings(interaction.guild, add, prepend);
        const pingsString = ctx.i18n`Adding \`${escapeMarkdown(
          stripMentions(prepend)
        )}\` for ${add?.events?.length || 0} events, ${add?.items?.length || 0} items`;
        await interaction.editReply(
          withEphemeral(ctx.ephemerate, { content: `${addString}\n${removeString}\n${pingsString}` })
        );
      }
      await this.#generateWebhook(interaction, ctx, channel);
    }
  }

  static setupWebhookAfterSave(interaction, ctx, channel, thread?) {
    return this.#generateWebhook(interaction, ctx, channel, thread);
  }

  /**
   * Generate webhook for channel
   * @param {Discord.CommandInteraction} interaction message containing channel context
   * @param {CommandContext} ctx to set up everything
   * @param {Discord.TextChannel} [channel] to set up
   * @param {Discord.ThreadChannel} [thread] to post to
   */
  static async #generateWebhook(interaction, ctx, channel, thread?) {
    channel = channel || interaction.channel;
    if (channel.permissionsFor(interaction.client.user).has(PermissionFlagsBits.ManageWebhooks)) {
      let webhook;
      let existingWebhooks;
      let setupMsg;
      try {
        setupMsg = await interaction.followUp({
          content: 'Setting up webhook...',
        });
        existingWebhooks = (await channel.fetchWebhooks()).filter(
          (w) => w.isIncoming() && w?.owner?.id === interaction?.client?.user?.id && !!w.token
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
      await ctx.settings.channels.setWebhook(channel, webhook);
    } else {
      await interaction.followUp(`${emojify('red_tick')} Cannot set up webhooks: missing permissions.`);
    }
    const upd = await interaction.followUp(`${emojify('empty')} Checking channel...`);
    try {
      ctx.settings.guilds.checkUpdateChannel(channel);
      await upd.edit(`${emojify('green_tick')} Channel checked`);
      setTimeout(async () => upd.delete(), 10000);
    } catch (e) {
      ctx.logger.error(e);
      await upd.edit(`${emojify('red_tick')} Channel check failed, contact support`);
    }
  }
}
