import { NextResponse } from 'next/server';

import { requireGuildAccess } from '@/lib/auth/apiAuth';

export async function GET(_request: Request, { params }: { params: Promise<{ guildId: string }> }) {
  try {
    const { guildId } = await params;
    const { services } = await requireGuildAccess(guildId, 'elevated_roles');
    const elevatedRoles = await services.guild.getElevatedRoles({ id: guildId });
    return NextResponse.json({ elevatedRoles: String(elevatedRoles || '') });
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: 'Failed to load elevated roles' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ guildId: string }> }) {
  try {
    const { guildId } = await params;
    const { services } = await requireGuildAccess(guildId, 'elevated_roles');
    const body = (await request.json()) as { roleIds?: string[] };
    await services.guild.setElevatedRoles({ id: guildId }, body.roleIds ?? []);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: 'Failed to update elevated roles' }, { status: 500 });
  }
}
