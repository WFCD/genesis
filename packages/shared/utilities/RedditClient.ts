import fetch from 'node-fetch';

import type { Logger } from '#shared/types/logger';

const defaultUserAgent = `genesis:discord-bot:${process.env.npm_package_version ?? '0.0.0'} (by /u/wfcd)`;

export type RedditPost = {
  title: string;
  permalink: string;
  selftext?: string;
  thumbnail?: string;
  url?: string;
  subreddit_name_prefixed?: string;
  created_utc?: number;
  is_gallery?: boolean;
  preview?: { images: Array<{ source: { url: string } }> };
  media_metadata?: Record<string, { s: { u: string }; status?: string }>;
  gallery_data?: { items: Array<{ media_id: string }> };
};

type RedditListingResponse = {
  data?: { children?: Array<{ data?: RedditPost }> };
};

const hasDisplayableImage = (post: RedditPost) => {
  if (post.is_gallery) return true;
  if (post.preview?.images?.[0]?.source?.url) return true;
  if (post.url && /\.(jpe?g|png|gif|webp)(\?|$)/i.test(post.url)) return true;
  return false;
};

/** Pick a random hot post from a subreddit (replaces blocked `random-reddit` fetches). */
export async function fetchRandomSubredditPost(subreddit: string, opts: { imageOnly?: boolean; logger?: Logger } = {}) {
  const sub = encodeURIComponent(subreddit.replace(/^r\//i, ''));
  const url = `https://www.reddit.com/r/${sub}/hot.json?limit=100&raw_json=1`;
  const userAgent = process.env.REDDIT_USER_AGENT || defaultUserAgent;

  const response = await fetch(url, {
    headers: {
      'User-Agent': userAgent,
      Accept: 'application/json',
    },
  });

  const contentType = response.headers.get('content-type') ?? '';
  if (!response.ok || !contentType.includes('json')) {
    const snippet = (await response.text()).slice(0, 160).replace(/\s+/g, ' ');
    throw new Error(`Reddit HTTP ${response.status} for r/${subreddit}: ${snippet}`);
  }

  const body = (await response.json()) as RedditListingResponse;
  const posts = body.data?.children?.map((c) => c.data).filter(Boolean) as RedditPost[] | undefined;
  if (!posts?.length) {
    throw new Error(`No posts returned for r/${subreddit}`);
  }

  const pool = opts.imageOnly ? posts.filter(hasDisplayableImage) : posts;
  if (!pool.length) {
    throw new Error(`No suitable posts in r/${subreddit}${opts.imageOnly ? ' (image filter)' : ''}`);
  }

  opts.logger?.debug(`Reddit r/${subreddit}: picked from ${pool.length} candidate posts`);
  return pool[Math.floor(Math.random() * pool.length)];
}

/** Best-effort image URL for embeds (gallery, preview, direct link). */
export function resolvePostImageUrl(post: RedditPost): string | undefined {
  if (post.is_gallery && post.media_metadata && post.gallery_data?.items?.length) {
    const item = post.gallery_data.items[Math.floor(Math.random() * post.gallery_data.items.length)];
    const meta = post.media_metadata[item.media_id];
    if (meta?.s?.u) return meta.s.u.replace(/&amp;/g, '&');
  }

  const preview = post.preview?.images?.[0]?.source?.url;
  if (preview) return preview.replace(/&amp;/g, '&');

  if (post.url && /\.(jpe?g|png|gif|webp)(\?|$)/i.test(post.url)) {
    return post.url.replace('gifv', 'gif');
  }

  if (post.thumbnail?.startsWith('http')) return post.thumbnail;

  return undefined;
}
