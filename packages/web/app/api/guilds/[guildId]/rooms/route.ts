import { NextResponse } from 'next/server';

import { requireGuildAccess } from '@/lib/auth/apiAuth';

export async function GET(_request: Request, { params }: { params: Promise<{ guildId: string }> }) {
  try {
    const { guildId } = await params;
    const { services } = await requireGuildAccess(guildId, 'rooms');
    const settings = await services.rooms.getRoomSettings({ id: guildId });
    return NextResponse.json({ settings });
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: 'Failed to load room settings' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ guildId: string }> }) {
  try {
    const { guildId } = await params;
    const { services } = await requireGuildAccess(guildId, 'rooms');
    const body = (await request.json()) as Record<string, string | boolean | null>;
    await services.rooms.patchRoomSettings({ id: guildId }, body);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: 'Failed to update room settings' }, { status: 500 });
  }
}
