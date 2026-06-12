import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') ?? '';
  const { searchTrackables } = await import('@/lib/meta');
  return NextResponse.json({ results: searchTrackables(q) });
}
