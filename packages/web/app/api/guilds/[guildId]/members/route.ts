import { NextResponse } from 'next/server';

import { requireGuildAccess } from '@/lib/auth/apiAuth';
import { searchGuildMembers } from '@/lib/discord';

export async function GET(request: Request, { params }: { params: Promise<{ guildId: string }> }) {
  try {
    const { guildId } = await params;
    await requireGuildAccess(guildId, 'pings');
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') ?? '';
    const limit = Number(searchParams.get('limit') ?? '10');
    const members = await searchGuildMembers(guildId, q, Number.isFinite(limit) ? limit : 10);
    return NextResponse.json({ members });
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: 'Failed to search guild members' }, { status: 500 });
  }
}
