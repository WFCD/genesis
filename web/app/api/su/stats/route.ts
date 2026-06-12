import { NextResponse } from 'next/server';

import { getDatabase } from '@/lib/db';
import { requireOwner } from '@/lib/auth/ownerAuth';

export async function POST(request: Request) {
  try {
    await requireOwner();
    const body = (await request.json()) as { commandId?: string };
    const commandId = body.commandId?.trim();
    if (!commandId) {
      return NextResponse.json({ error: 'commandId required' }, { status: 400 });
    }

    const db = await getDatabase();
    const count = await db.statistics.getGuildStats(undefined as never, commandId, true);
    return NextResponse.json({ commandId, count: Number(count) || 0 });
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
