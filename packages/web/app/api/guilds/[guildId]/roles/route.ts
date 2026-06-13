import { NextResponse } from 'next/server';

import { requireGuildAccess } from '@/lib/auth/apiAuth';
import { fetchGuildRoles } from '@/lib/discord';

export async function GET(_request: Request, { params }: { params: Promise<{ guildId: string }> }) {
  try {
    const { guildId } = await params;
    await requireGuildAccess(guildId, 'general');
    const roles = await fetchGuildRoles(guildId);
    return NextResponse.json({ roles });
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: 'Failed to load roles' }, { status: 500 });
  }
}
