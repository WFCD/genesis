import { NextResponse } from 'next/server';

import { fetchDiscordGuildInfo } from '@/lib/discord';
import { requireOwner } from '@/lib/auth/ownerAuth';

export async function POST(request: Request) {
  try {
    await requireOwner();
    const body = (await request.json()) as { guildId?: string };
    const guildId = body.guildId?.trim();
    if (!guildId) {
      return NextResponse.json({ error: 'guildId required' }, { status: 400 });
    }

    const result = await fetchDiscordGuildInfo(guildId);
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({ guild: result });
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: 'Failed to fetch guild info' }, { status: 500 });
  }
}
