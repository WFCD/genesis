import { NextResponse } from 'next/server';

import { getDatabase } from '@/lib/db';
import { requireOwner } from '@/lib/auth/ownerAuth';

const SCOPES = new Set(['pings', 'trackables', 'guild', 'all']);

export async function POST(request: Request) {
  try {
    await requireOwner();
    const body = (await request.json()) as { scope?: string; guildId?: string };
    const scope = body.scope?.trim();
    const guildId = body.guildId?.trim();

    if (!scope || !SCOPES.has(scope)) {
      return NextResponse.json({ error: 'scope must be pings, trackables, guild, or all' }, { status: 400 });
    }

    const db = await getDatabase();
    if (guildId) {
      await db.workerCache.enqueueGuildRefresh(guildId, scope as 'pings' | 'trackables' | 'guild' | 'all');
      return NextResponse.json({
        ok: true,
        message: `Queued \`${scope}\` worker cache refresh for guild \`${guildId}\`. Workers pick up within ~1 minute.`,
      });
    }

    await db.workerCache.bumpRefreshStamp(scope as 'pings' | 'trackables' | 'guild' | 'all');
    return NextResponse.json({
      ok: true,
      message: `Bumped global \`${scope}\` worker cache refresh. Workers pick up within ~1 minute.`,
    });
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: 'Failed to refresh cache' }, { status: 500 });
  }
}
