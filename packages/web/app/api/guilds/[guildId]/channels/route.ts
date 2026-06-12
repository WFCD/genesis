import { NextResponse } from 'next/server';

import { requireGuildAccess } from '@/lib/auth/apiAuth';
import { fetchGuildChannels } from '@/lib/discord';

export async function GET(_request: Request, { params }: { params: Promise<{ guildId: string }> }) {
  try {
    const { guildId } = await params;
    await requireGuildAccess(guildId, 'general');
    const channels = await fetchGuildChannels(guildId);
    return NextResponse.json({ channels });
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: 'Failed to load channels' }, { status: 500 });
  }
}
