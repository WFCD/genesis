import { NextResponse } from 'next/server';

import { fetchDiscordGuildInfo, leaveDiscordGuild } from '@/lib/discord';
import { requireOwner } from '@/lib/auth/ownerAuth';
import { invalidateCached } from '@/lib/cache/server';

export async function POST(request: Request) {
  try {
    await requireOwner();
    const body = (await request.json()) as { guildId?: string };
    const guildId = body.guildId?.trim();
    if (!guildId) {
      return NextResponse.json({ error: 'guildId required' }, { status: 400 });
    }

    const preview = await fetchDiscordGuildInfo(guildId);
    if ('error' in preview) {
      return NextResponse.json({ error: preview.error }, { status: preview.status });
    }

    const result = await leaveDiscordGuild(guildId);
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    invalidateCached('db:known-guild-ids');

    return NextResponse.json({
      ok: true,
      message: `Bot left ${preview.name} (${guildId}).`,
      guildName: preview.name,
    });
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: 'Failed to leave guild' }, { status: 500 });
  }
}
