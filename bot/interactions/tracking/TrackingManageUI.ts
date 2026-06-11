import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  StringSelectMenuBuilder,
  type ChatInputCommandInteraction,
  type MessageComponentInteraction,
  type ModalSubmitInteraction,
} from 'discord.js';

import {
  chunkify,
  toTitleCase,
  trackableEvents,
  trackableItems,
  withEphemeral,
} from '#shared/utilities/CommonFunctions';
import { enqueueWorkerCacheRefresh } from '#shared/utilities/enqueueWorkerCacheRefresh';

import Tracking from './Tracking';

const PREFIX = 'tm';
const SESSION_TTL_MS = 15 * 60 * 1000;
const subgrouped = ['arbitration', 'fissures', 'twitter', 'fissures.sp'];

type TrackingSession = {
  userId: string;
  channelId: string;
  threadId?: string;
  items: string[];
  events: string[];
  group?: string;
  subgroup?: string;
  page: number;
  expiresAt: number;
};

const chunkerate = (track: Pick<TrackingSession, 'items' | 'events'>) => {
  const itemString = track.items.length ? track.items.map((i) => `\`${i}\``).join(', ') : 'None';
  const eventString = track.events.length ? track.events.map((m) => `\`${m}\``).join(', ') : 'None';
  const format = `**Current Items:**\n${itemString}\n\n**Current Events:**\n${eventString}`;
  return chunkify({ string: format, maxLength: 500, breakChar: ',' });
};

const sessions = new Map<string, TrackingSession>();

const sessionKey = (userId: string, channelId: string, threadId?: string) =>
  `${userId}:${channelId}:${threadId ?? '0'}`;

const parseId = (customId: string) => {
  const parts = customId.split(':');
  return {
    channelId: parts[1],
    threadId: parts[2] === '0' ? undefined : parts[2],
    component: parts.slice(3).join(':'),
  };
};

const buildId = (channelId: string, threadId: string | undefined, component: string) =>
  `${PREFIX}:${channelId}:${threadId ?? '0'}:${component}`;

const trackKey = (session: TrackingSession) => {
  const { group, subgroup } = session;
  if (!group) return undefined;
  if (subgrouped.includes(group) && !subgroup) return undefined;
  return subgroup || group;
};

const titleGroup = (groupId: string) => {
  switch (groupId) {
    case 'baseEvents':
      return 'Events';
    case 'fissures.sp':
      return 'Steel Path Fissures';
    default:
      return toTitleCase(groupId.split('.').join(' '));
  }
};

type ManageInteraction = ChatInputCommandInteraction | ModalSubmitInteraction;

export default class TrackingManageUI {
  static #getSession(userId: string, channelId: string, threadId?: string) {
    const key = sessionKey(userId, channelId, threadId);
    const session = sessions.get(key);
    if (!session || session.expiresAt < Date.now()) {
      sessions.delete(key);
      return undefined;
    }
    return session;
  }

  static #touchSession(session: TrackingSession) {
    session.expiresAt = Date.now() + SESSION_TTL_MS;
    sessions.set(sessionKey(session.userId, session.channelId, session.threadId), session);
  }

  static async #createSession(userId: string, channel, thread?, ctx?) {
    const session: TrackingSession = {
      userId,
      channelId: channel.id,
      threadId: thread?.id,
      items: await ctx.settings.tracking.getTrackedItems(channel, thread),
      events: await ctx.settings.tracking.getTrackedEventTypes(channel, thread),
      page: 0,
      expiresAt: Date.now() + SESSION_TTL_MS,
    };
    this.#touchSession(session);
    return session;
  }

  static async start(interaction: ManageInteraction, ctx, channel, thread?) {
    if (!interaction.deferred && !interaction.replied) {
      await interaction.deferReply(withEphemeral(ctx.ephemerate));
    }

    const session = await this.#createSession(interaction.user.id, channel, thread, ctx);
    const payload = this.#render(session, channel, thread);
    return interaction.editReply(withEphemeral(ctx.ephemerate, payload));
  }

  static async #updatePanel(interaction: MessageComponentInteraction, ctx, session: TrackingSession, channel, thread?) {
    return interaction.editReply(withEphemeral(ctx.ephemerate, this.#render(session, channel, thread)));
  }

  static #savedEmbed(channel, thread?) {
    return new EmbedBuilder()
      .setColor(0x57f287)
      .setTitle('Tracking saved')
      .setDescription(`${channel}${thread ? `\nThread: ${thread}` : ''}`)
      .setFooter({ text: 'Tracking saved' });
  }

  static async handleComponent(interaction: MessageComponentInteraction, ctx, channel, thread?) {
    const { channelId, threadId, component } = parseId(interaction.customId);
    if (channelId !== channel.id || (threadId ?? undefined) !== (thread?.id ?? undefined)) {
      return interaction.reply(withEphemeral(true, { content: 'This panel is for a different channel.' }));
    }

    const session = this.#getSession(interaction.user.id, channelId, threadId);
    if (!session) {
      return interaction.reply(withEphemeral(true, { content: 'Session expired — run `/tracking manage` again.' }));
    }

    if (interaction.user.id !== session.userId) {
      return interaction.reply(
        withEphemeral(true, { content: 'Only the user who opened this panel can change tracking.' })
      );
    }

    await interaction.deferUpdate();

    try {
      const bumpPage = (chunks: string[]) => {
        if (session.page > chunks.length - 1) session.page = Math.max(chunks.length - 1, 0);
      };

      if (component === 'pageprev' && interaction.isButton()) {
        if (session.page > 0) session.page -= 1;
      } else if (component === 'pagenext' && interaction.isButton()) {
        const chunks = chunkerate(session);
        if (session.page < chunks.length - 1) session.page += 1;
        bumpPage(chunks);
      } else if (component === 'trackgrp' && interaction.isStringSelectMenu()) {
        session.group = interaction.values[0];
        session.subgroup = undefined;
        session.page = 0;
      } else if (component === 'tracksub' && interaction.isStringSelectMenu()) {
        session.subgroup = interaction.values[0];
        session.page = 0;
      } else if (component === 'trackpick' && interaction.isStringSelectMenu()) {
        const group = session.group;
        if (group === 'items') {
          session.items = interaction.values;
        } else {
          const key = session.subgroup || group;
          const pool = trackableEvents[key] ?? [];
          session.events = session.events.filter((e) => !pool.includes(e));
          session.events.push(...interaction.values);
        }
        session.page = 0;
      } else if (component === 'tracksave' && interaction.isButton()) {
        const previousEvents = await ctx.settings.tracking.getTrackedEventTypes(channel, thread);
        await ctx.settings.tracking.setTrackables(channel, {
          items: session.items,
          events: session.events,
          thread,
        });
        void enqueueWorkerCacheRefresh(ctx.settings, interaction.guildId, channel, {
          trackableTypes: [...previousEvents, ...session.events],
          refreshGuild: true,
        }).catch((err) => ctx.logger.error(err, 'TM'));
        sessions.delete(sessionKey(session.userId, channelId, threadId));
        await interaction.editReply(
          withEphemeral(ctx.ephemerate, { embeds: [this.#savedEmbed(channel, thread)], components: [] })
        );
        void Tracking.setupWebhookAfterSave(interaction, ctx, channel, thread).catch((err) =>
          ctx.logger.error(err, 'TM')
        );
        return;
      } else if (component === 'trackall' && interaction.isButton()) {
        if (session.group === 'items') {
          session.items = [...trackableItems.items];
        } else if (session.group) {
          const pool = trackableEvents[session.subgroup || session.group] ?? [];
          session.events = Array.from(new Set([...session.events, ...pool]));
        }
        session.page = 0;
      } else if (component === 'trackclear' && interaction.isButton()) {
        session.items = [];
        session.events = [];
        session.group = undefined;
        session.subgroup = undefined;
        session.page = 0;
      } else if (component === 'trackreset' && interaction.isButton()) {
        session.items = await ctx.settings.tracking.getTrackedItems(channel, thread);
        session.events = await ctx.settings.tracking.getTrackedEventTypes(channel, thread);
        session.group = undefined;
        session.subgroup = undefined;
        session.page = 0;
      } else if (component === 'close' && interaction.isButton()) {
        sessions.delete(sessionKey(session.userId, channelId, threadId));
        return interaction.editReply(
          withEphemeral(ctx.ephemerate, { content: 'Tracking panel closed.', embeds: [], components: [] })
        );
      }

      this.#touchSession(session);
      return this.#updatePanel(interaction, ctx, session, channel, thread);
    } catch (err) {
      ctx.logger.error(err, 'TM');
      return interaction
        .followUp(
          withEphemeral(true, { content: 'Something went wrong updating tracking. Try `/tracking manage` again.' })
        )
        .catch(() => undefined);
    }
  }

  static #render(session: TrackingSession, channel, thread?) {
    const { items, events, group, subgroup, page } = session;
    const chunks = chunkerate(session);
    const safePage = Math.min(Math.max(page, 0), Math.max(chunks.length - 1, 0));
    const trackingBody = chunks[safePage] ?? chunks[0] ?? '';

    const embed = new EmbedBuilder()
      .setTitle('Manage Tracking')
      .setDescription(`${channel}${thread ? `\nThread: ${thread}` : ''}\n\n${trackingBody}`)
      .setColor(0x77dd77);

    if (chunks.length > 1) {
      embed.setFooter({ text: `Page ${safePage + 1}/${chunks.length}` });
    }

    const rows: ActionRowBuilder<any>[] = [];

    if (chunks.length > 1) {
      rows.push(
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId(buildId(session.channelId, session.threadId, 'pageprev'))
            .setLabel('Previous')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(safePage === 0),
          new ButtonBuilder()
            .setCustomId(buildId(session.channelId, session.threadId, 'pagenext'))
            .setLabel('Next')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(safePage >= chunks.length - 1)
        )
      );
    }

    const groups = [
      { label: 'Items', value: 'items', default: group === 'items' },
      ...Object.keys(trackableEvents)
        .filter(
          (e) =>
            (!['events', 'opts', 'kuva', 'cetus', 'arbitration'].includes(e) &&
              !e.startsWith('fissures.') &&
              !e.startsWith('twitter.') &&
              !e.startsWith('arbitration.')) ||
            e === 'fissures.sp'
        )
        .slice(0, 24)
        .map((e) => ({
          label: titleGroup(e),
          value: e,
          default: group === e,
        })),
    ];

    rows.push(
      new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId(buildId(session.channelId, session.threadId, 'trackgrp'))
          .setPlaceholder('Tracking group')
          .addOptions(groups)
      )
    );

    if (group && subgrouped.includes(group)) {
      const subgroups = Object.keys(trackableEvents)
        .filter((e) => e.startsWith(`${group}.`) && (group === 'fissures' ? !e.startsWith('fissures.sp') : true))
        .slice(0, 25)
        .map((e) => ({
          label: titleGroup(e),
          value: e,
          default: subgroup === e,
        }));
      if (subgroups.length) {
        rows.push(
          new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
            new StringSelectMenuBuilder()
              .setCustomId(buildId(session.channelId, session.threadId, 'tracksub'))
              .setPlaceholder('Tracking sub-group')
              .addOptions(subgroups)
          )
        );
      }
    }

    const currentKey = trackKey(session);
    const list = currentKey === 'items' ? trackableItems.items : currentKey ? trackableEvents[currentKey] : undefined;
    if (list?.length) {
      const selected = currentKey === 'items' ? items : events;
      rows.push(
        new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId(buildId(session.channelId, session.threadId, 'trackpick'))
            .setPlaceholder('Trackables (multi-select)')
            .setMinValues(0)
            .setMaxValues(Math.min(list.length, 25))
            .addOptions(
              list.slice(0, 25).map((li: string) => ({
                label: titleGroup(li).slice(0, 100),
                value: li,
                default: selected.includes(li),
              }))
            )
        )
      );
    }

    rows.push(
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(buildId(session.channelId, session.threadId, 'tracksave'))
          .setLabel('Save')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId(buildId(session.channelId, session.threadId, 'trackall'))
          .setLabel('All')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(!group),
        new ButtonBuilder()
          .setCustomId(buildId(session.channelId, session.threadId, 'trackreset'))
          .setLabel('Reset')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId(buildId(session.channelId, session.threadId, 'close'))
          .setLabel('Cancel')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId(buildId(session.channelId, session.threadId, 'trackclear'))
          .setLabel('Clear')
          .setStyle(ButtonStyle.Danger)
      )
    );

    return { embeds: [embed], components: rows.slice(0, 5) };
  }

  static isManageComponent(customId: string) {
    return customId.startsWith(`${PREFIX}:`);
  }
}
