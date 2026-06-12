import { NextResponse } from 'next/server';

import { getDatabase } from '@/lib/db';
import { requireOwner } from '@/lib/auth/ownerAuth';

export async function POST(request: Request) {
  try {
    await requireOwner();
    const body = (await request.json()) as { channelId?: string };
    const channelId = body.channelId?.trim();
    if (!channelId) {
      return NextResponse.json({ error: 'channelId required' }, { status: 400 });
    }

    const db = await getDatabase();
    await db.channels.deleteWebhooksForChannel(channelId);
    return NextResponse.json({ ok: true, message: 'Webhooks cleared for channel.' });
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: 'Failed to clear webhooks' }, { status: 500 });
  }
}
