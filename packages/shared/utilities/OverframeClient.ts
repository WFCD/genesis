import fetch from 'node-fetch';

import type WorldStateClient from './WorldStateClient';

const API_BASE = 'https://overframe.gg/api/v1';
const SITE_BASE = 'https://overframe.gg';
const USER_AGENT = 'GenesisBot/2.0 (+https://genesis.warframestat.us; Warframe Discord Bot)';

type ApiAuthor = {
  username?: string;
};

type ApiItemData = {
  id?: number;
  locTag?: string;
};

type ApiBuildSummary = {
  id: number;
  title: string;
  score?: number;
  url?: string;
  author?: ApiAuthor;
  formas?: number;
  guide_wordcount?: number;
  item_data?: ApiItemData;
};

type ApiBuildDetail = ApiBuildSummary & {
  description?: string;
  comment_count?: number;
  slots?: unknown[];
  created?: string;
  updated?: string;
};

type ApiListResponse = {
  count?: number;
  next?: string | null;
  previous?: string | null;
  results?: ApiBuildSummary[];
};

export type OverframeBuildSummary = {
  id: number;
  title: string;
  score: number;
  url: string;
  author: string;
  formas: number;
  guideWordcount: number;
  itemId?: number;
  locTag?: string;
};

export type OverframeBuildDetail = OverframeBuildSummary & {
  description: string;
  commentCount: number;
  modSlots: number;
  created?: string;
  updated?: string;
};

export type OverframeSearchMode = 'item' | 'title';

export type OverframeSearchParams = {
  query: string;
  itemId?: number;
  mode?: OverframeSearchMode;
  offset?: number;
  limit?: number;
};

export type OverframeSearchResult = {
  query: string;
  itemId?: number;
  searchUrl: string;
  count: number;
  offset: number;
  limit: number;
  results: OverframeBuildSummary[];
};

const buildUrl = (path: string) => `${SITE_BASE}${path.startsWith('/') ? path : `/${path}`}`;

const slugify = (text: string) =>
  text
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const slugFromBuildPath = (path: string) => {
  const match = path.match(/\/build\/\d+\/([^/]+)/);
  return match?.[1];
};

export const overframeItemUrl = (itemId: number, slug?: string) => {
  const slugPart = slug ? `${slug}/` : '';
  return `${SITE_BASE}/items/arsenal/${itemId}/${slugPart}`;
};

export const resolveOverframeBrowseUrl = (
  query: string,
  options: { itemId?: number; results?: OverframeBuildSummary[] } = {}
) => {
  const { itemId, results } = options;
  const resolvedItemId = itemId ?? results?.[0]?.itemId;
  if (!resolvedItemId) {
    return `${SITE_BASE}/`;
  }

  const sample = results?.find((row) => row.itemId === resolvedItemId) ?? results?.[0];
  const slug = (sample?.url && slugFromBuildPath(sample.url)) || slugify(query) || undefined;
  return overframeItemUrl(resolvedItemId, slug);
};

/** @deprecated use resolveOverframeBrowseUrl */
export const overframeSearchUrl = (query: string, itemId?: number, results?: OverframeBuildSummary[]) =>
  resolveOverframeBrowseUrl(query, { itemId, results });

const mapSummary = (row: ApiBuildSummary): OverframeBuildSummary => ({
  id: row.id,
  title: row.title,
  score: row.score ?? 0,
  url: buildUrl(row.url ?? `/build/${row.id}/`),
  author: row.author?.username ?? 'Unknown',
  formas: row.formas ?? 0,
  guideWordcount: row.guide_wordcount ?? 0,
  itemId: row.item_data?.id,
  locTag: row.item_data?.locTag,
});

const apiFetch = async <T>(path: string, params: Record<string, string>) => {
  const url = `${API_BASE}${path}?${new URLSearchParams(params)}`;
  const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  if (!response.ok) {
    throw new Error(`Overframe API ${response.status} ${response.statusText}`);
  }
  return response.json() as Promise<T>;
};

export async function searchOverframeBuilds({
  query,
  itemId,
  mode = 'title',
  offset = 0,
  limit = 25,
}: OverframeSearchParams): Promise<OverframeSearchResult> {
  const trimmed = query.trim();
  const params: Record<string, string> = {
    ordering: '-score',
    limit: String(Math.min(Math.max(limit, 1), 25)),
    offset: String(Math.max(offset, 0)),
  };
  if (itemId) {
    params.item_id = String(itemId);
  } else if (mode === 'item') {
    params.item_name = trimmed;
  } else {
    params.title = trimmed;
  }

  const payload = await apiFetch<ApiListResponse>('/builds/', params);
  const results = (payload.results ?? []).map(mapSummary);
  return {
    query: trimmed,
    itemId,
    searchUrl: resolveOverframeBrowseUrl(trimmed, { itemId, results }),
    count: payload.count ?? 0,
    offset,
    limit: Number(params.limit),
    results,
  };
}

export async function getOverframeBuild(id: number): Promise<OverframeBuildDetail | undefined> {
  const payload = await apiFetch<ApiBuildDetail>(`/builds/${id}/`, {});
  if (!payload?.id) return undefined;
  const summary = mapSummary(payload);
  return {
    ...summary,
    description: payload.description?.trim() ?? '',
    commentCount: payload.comment_count ?? 0,
    modSlots: payload.slots?.length ?? 0,
    created: payload.created,
    updated: payload.updated,
  };
}

export function isExactCatalogItem(query: string, ws?: WorldStateClient): boolean {
  if (!ws || !query.trim()) return false;
  const lower = query.trim().toLowerCase();
  const matches = [...ws.listWarframes(query.trim()), ...ws.listWeapons(query.trim())].filter(
    (item) => String(item.name ?? '').toLowerCase() === lower
  );
  return matches.length === 1;
}

export async function resolveOverframeItemId(query: string, ws?: WorldStateClient): Promise<number | undefined> {
  if (!isExactCatalogItem(query, ws)) return undefined;
  const trimmed = query.trim();
  const probe = await searchOverframeBuilds({ query: trimmed, mode: 'item', limit: 1 });
  return probe.results[0]?.itemId;
}
