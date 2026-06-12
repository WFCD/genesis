import fetch from 'node-fetch';

const WIKI_API = 'https://wiki.warframe.com/api.php';
const WIKI_SEARCH_BASE = 'https://wiki.warframe.com/index.php?search=';
const USER_AGENT = 'GenesisBot/2.0 (+https://genesis.warframestat.us; Warframe Discord Bot)';

type MediaWikiSearchResult = {
  title: string;
  pageid: number;
  snippet?: string;
};

type MediaWikiPage = {
  pageid?: number;
  title?: string;
  extract?: string;
  canonicalurl?: string;
  fullurl?: string;
  original?: {
    source?: string;
  };
};

export type WikiPageResult = {
  title: string;
  pageId: number;
  url: string;
  extract: string;
  thumbnail?: string;
};

export type WikiLookupResult = {
  query: string;
  searchUrl: string;
  totalHits: number;
  page?: WikiPageResult;
};

const wikiFetch = async (params: Record<string, string>) => {
  const url = `${WIKI_API}?${new URLSearchParams({ ...params, format: 'json' })}`;
  const response = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT },
  });
  if (!response.ok) {
    throw new Error(`Wiki API ${response.status} ${response.statusText}`);
  }
  return response.json() as Promise<Record<string, unknown>>;
};

export const wikiSearchUrl = (query: string) => `${WIKI_SEARCH_BASE}${encodeURIComponent(query.trim())}`;

export async function lookupWiki(query: string): Promise<WikiLookupResult> {
  const trimmed = query.trim();
  const searchUrl = wikiSearchUrl(trimmed);
  if (!trimmed) {
    return { query: trimmed, searchUrl, totalHits: 0 };
  }

  const searchPayload = await wikiFetch({
    action: 'query',
    list: 'search',
    srsearch: trimmed,
    srlimit: '1',
  });

  const searchBlock = searchPayload.query as
    | { search?: MediaWikiSearchResult[]; searchinfo?: { totalhits?: number } }
    | undefined;
  const totalHits = searchBlock?.searchinfo?.totalhits ?? 0;
  const hit = searchBlock?.search?.[0];
  if (!hit?.title) {
    return { query: trimmed, searchUrl, totalHits };
  }

  const pagePayload = await wikiFetch({
    action: 'query',
    prop: 'extracts|pageimages|info',
    exintro: '1',
    explaintext: '1',
    piprop: 'original',
    inprop: 'url',
    titles: hit.title,
  });

  const pages = (pagePayload.query as { pages?: Record<string, MediaWikiPage> } | undefined)?.pages ?? {};
  const page = Object.values(pages)[0];
  if (!page?.title) {
    return { query: trimmed, searchUrl, totalHits };
  }

  return {
    query: trimmed,
    searchUrl,
    totalHits,
    page: {
      title: page.title,
      pageId: page.pageid ?? hit.pageid,
      url:
        page.canonicalurl ||
        page.fullurl ||
        `https://wiki.warframe.com/w/${encodeURIComponent(page.title.replace(/ /g, '_'))}`,
      extract: page.extract?.trim() || hit.snippet?.replace(/<\/?span[^>]*>/g, '') || '',
      thumbnail: page.original?.source,
    },
  };
}
