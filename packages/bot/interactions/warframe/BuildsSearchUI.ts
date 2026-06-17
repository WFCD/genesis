import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  type ChatInputCommandInteraction,
  type MessageComponentInteraction,
} from 'discord.js';

import { OverframeBuildEmbed, OverframeSearchEmbed } from '#shared/embeds/OverframeBuildEmbed';
import type { CommandContext } from '#shared/types/context';
import { withEphemeral } from '#shared/utilities/CommonFunctions';
import {
  getOverframeBuild,
  isExactCatalogItem,
  OverframeTimeoutError,
  OVERFRAME_SEARCH_TIMEOUT_MS,
  resolveOverframeItemId,
  resolveOverframeQueryUrl,
  searchOverframeBuilds,
  type OverframeBuildSummary,
  type OverframeSearchMode,
  type OverframeSearchResult,
} from '#shared/utilities/OverframeClient';

const PREFIX = 'bs';
const SESSION_TTL_MS = 10 * 60 * 1000;
const PAGE_SIZE = 25;

type SearchSession = {
  userId: string;
  query: string;
  itemId?: number;
  searchMode: OverframeSearchMode;
  offset: number;
  count: number;
  results: OverframeBuildSummary[];
  searchUrl: string;
  expiresAt: number;
};

const sessions = new Map<string, SearchSession>();

const sessionKey = (userId: string) => userId;

const parseId = (customId: string) => {
  const parts = customId.split(':');
  return { userId: parts[1], component: parts.slice(2).join(':') };
};

const buildId = (userId: string, component: string) => `${PREFIX}:${userId}:${component}`;

const withSearchTimeout = <T>(promise: Promise<T>) =>
  Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new OverframeTimeoutError()), OVERFRAME_SEARCH_TIMEOUT_MS)
    ),
  ]);

const overframeLinkRow = (searchUrl: string) =>
  new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setLabel('Browse on Overframe').setStyle(ButtonStyle.Link).setURL(searchUrl)
  );

export default class BuildsSearchUI {
  static isManageComponent(customId: string) {
    return customId.startsWith(`${PREFIX}:`);
  }

  static #getSession(userId: string) {
    const session = sessions.get(sessionKey(userId));
    if (!session || session.expiresAt < Date.now()) {
      sessions.delete(sessionKey(userId));
      return undefined;
    }
    return session;
  }

  static #touchSession(session: SearchSession) {
    session.expiresAt = Date.now() + SESSION_TTL_MS;
    sessions.set(sessionKey(session.userId), session);
  }

  static #searchResult(session: SearchSession): OverframeSearchResult {
    return {
      query: session.query,
      itemId: session.itemId,
      searchUrl: session.searchUrl,
      count: session.count,
      offset: session.offset,
      limit: PAGE_SIZE,
      results: session.results,
    };
  }

  static #selectOptions(session: SearchSession) {
    return session.results.map((build) => ({
      label: build.title.slice(0, 100),
      description: `★ ${build.score} • ${build.author} • ${build.formas} forma`.slice(0, 100),
      value: String(build.id),
    }));
  }

  static #listComponents(session: SearchSession) {
    const rows = [];

    if (session.results.length) {
      rows.push(
        new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId(buildId(session.userId, 'pick'))
            .setPlaceholder('Choose a build to preview')
            .addOptions(this.#selectOptions(session))
        )
      );
    }

    rows.push(
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(buildId(session.userId, 'prev'))
          .setLabel('◀')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(session.offset <= 0),
        new ButtonBuilder()
          .setCustomId(buildId(session.userId, 'next'))
          .setLabel('▶')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(session.offset + PAGE_SIZE >= session.count),
        new ButtonBuilder().setLabel('Browse on Overframe').setStyle(ButtonStyle.Link).setURL(session.searchUrl),
        new ButtonBuilder().setCustomId(buildId(session.userId, 'close')).setLabel('Close').setStyle(ButtonStyle.Danger)
      )
    );

    return {
      embeds: [new OverframeSearchEmbed(this.#searchResult(session))],
      components: rows,
    };
  }

  static #detailComponents(session: SearchSession, buildUrl: string) {
    return {
      components: [
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId(buildId(session.userId, 'back'))
            .setLabel('Back to results')
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setLabel('Open build on Overframe').setStyle(ButtonStyle.Link).setURL(buildUrl),
          new ButtonBuilder().setLabel('Browse on Overframe').setStyle(ButtonStyle.Link).setURL(session.searchUrl)
        ),
      ],
    };
  }

  static async #loadPage(session: SearchSession) {
    const page = await searchOverframeBuilds({
      query: session.query,
      itemId: session.itemId,
      mode: session.searchMode,
      offset: session.offset,
      limit: PAGE_SIZE,
    });
    session.count = page.count;
    session.results = page.results;
    session.searchUrl = page.searchUrl;
  }

  static async start(interaction: ChatInputCommandInteraction, ctx: CommandContext, query: string) {
    const trimmed = query.trim();
    const exactItem = isExactCatalogItem(trimmed, ctx.ws);
    let searchMode: OverframeSearchMode = exactItem ? 'item' : 'title';
    const fallbackSearchUrl = resolveOverframeQueryUrl(trimmed, { mode: searchMode });

    try {
      const page = await withSearchTimeout(
        (async () => {
          const itemId = exactItem ? await resolveOverframeItemId(trimmed, ctx.ws) : undefined;
          searchMode = exactItem ? 'item' : 'title';

          let result = await searchOverframeBuilds({ query: trimmed, itemId, mode: searchMode, limit: PAGE_SIZE });
          if (!result.results.length && exactItem) {
            searchMode = 'title';
            result = await searchOverframeBuilds({ query: trimmed, mode: searchMode, limit: PAGE_SIZE });
          }
          return result;
        })()
      );

      if (!page.results.length) {
        return interaction.editReply(
          withEphemeral(ctx.ephemerate, {
            embeds: [new OverframeSearchEmbed(page)],
            components: [overframeLinkRow(page.searchUrl)],
          })
        );
      }

      const session: SearchSession = {
        userId: interaction.user.id,
        query: page.query,
        itemId: page.itemId,
        searchMode,
        offset: 0,
        count: page.count,
        results: page.results,
        searchUrl: page.searchUrl,
        expiresAt: Date.now() + SESSION_TTL_MS,
      };
      this.#touchSession(session);
      return interaction.editReply(withEphemeral(ctx.ephemerate, this.#listComponents(session)));
    } catch (err) {
      if (err instanceof OverframeTimeoutError) {
        return interaction.editReply(
          withEphemeral(ctx.ephemerate, {
            content: 'Failed to find an overframe result in a minute',
            components: [overframeLinkRow(fallbackSearchUrl)],
          })
        );
      }
      ctx.logger?.error?.(err, 'BuildsSearchUI');
      return interaction.editReply(
        withEphemeral(ctx.ephemerate, {
          content: ctx.i18n`Could not reach Overframe right now. Try again in a moment.`,
          components: [overframeLinkRow(fallbackSearchUrl)],
        })
      );
    }
  }

  static async handleComponent(interaction: MessageComponentInteraction, ctx: CommandContext) {
    const { userId, component } = parseId(interaction.customId);
    if (interaction.user.id !== userId) {
      return interaction.reply(withEphemeral(true, { content: 'This panel belongs to another user.' }));
    }

    const session = this.#getSession(userId);
    if (!session) {
      return interaction.reply(
        withEphemeral(true, { content: 'Search session expired — run `/builds search` again.' })
      );
    }

    if (component === 'close' && interaction.isButton()) {
      sessions.delete(sessionKey(userId));
      return interaction.update({ content: 'Search closed.', embeds: [], components: [] });
    }

    await interaction.deferUpdate();

    try {
      if (component === 'prev' && interaction.isButton()) {
        session.offset = Math.max(session.offset - PAGE_SIZE, 0);
        await this.#loadPage(session);
      } else if (component === 'next' && interaction.isButton()) {
        session.offset = Math.min(session.offset + PAGE_SIZE, Math.max(session.count - PAGE_SIZE, 0));
        await this.#loadPage(session);
      } else if (component === 'back' && interaction.isButton()) {
        return interaction.editReply(withEphemeral(ctx.ephemerate, this.#listComponents(session)));
      } else if (component === 'pick' && interaction.isStringSelectMenu()) {
        const buildIdValue = Number.parseInt(interaction.values[0], 10);
        const build = await getOverframeBuild(buildIdValue);
        if (!build) {
          return interaction.followUp(withEphemeral(true, { content: 'That build could not be loaded.' }));
        }
        this.#touchSession(session);
        return interaction.editReply(
          withEphemeral(ctx.ephemerate, {
            embeds: [new OverframeBuildEmbed(build, { query: session.query })],
            ...this.#detailComponents(session, build.url),
          })
        );
      }

      this.#touchSession(session);
      return interaction.editReply(withEphemeral(ctx.ephemerate, this.#listComponents(session)));
    } catch (err) {
      ctx.logger?.error?.(err, 'BuildsSearchUI');
      return interaction.followUp(
        withEphemeral(true, { content: 'Something went wrong updating the Overframe search.' })
      );
    }
  }
}
