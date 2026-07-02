import { NextResponse } from 'next/server';

export const jsonCached = (data: unknown, maxAgeSeconds = 3600) => NextResponse.json(data, {
  headers: {
    'Cache-Control': `public, max-age=${maxAgeSeconds}, stale-while-revalidate=${maxAgeSeconds * 24}`,
  },
});
