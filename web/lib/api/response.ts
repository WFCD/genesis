import { NextResponse } from 'next/server';

export function jsonCached(data: unknown, maxAgeSeconds = 3600) {
  return NextResponse.json(data, {
    headers: {
      'Cache-Control': `public, max-age=${maxAgeSeconds}, stale-while-revalidate=${maxAgeSeconds * 24}`,
    },
  });
}
