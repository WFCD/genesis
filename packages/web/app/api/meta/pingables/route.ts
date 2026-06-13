import { NextResponse } from 'next/server';

import { searchPingables } from '@/lib/meta/pingables';

export function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') ?? '';
  return NextResponse.json({ results: searchPingables(q) });
}
