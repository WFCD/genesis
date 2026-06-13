import { NextResponse } from 'next/server';

import { channelRef, rejectThreadRoutes } from '@/lib/channels/route';
import { resolveChannelRoute } from '@/lib/channels/route.server';
import { requireGuildAccess } from '@/lib/auth/apiAuth';

export async function PATCH(request: Request, { params }: { params: Promise<{ guildId: string; channelId: string }> }) {
  try {
    const { guildId, channelId: routeId } = await params;
    const resolved = await resolveChannelRoute(routeId, guildId);
    if (!resolved) return NextResponse.json({ error: 'Channel not found' }, { status: 404 });
    rejectThreadRoutes(resolved);

    const { services } = await requireGuildAccess(guildId, 'permissions', resolved.parentChannelId);
    const body = (await request.json()) as {
      scope?: 'channel' | 'guild';
      roleId?: string;
      commandId?: string;
      allowed?: boolean;
    };
    if (!body.roleId || !body.commandId || typeof body.allowed !== 'boolean') {
      return NextResponse.json({ error: 'roleId, commandId, and allowed required' }, { status: 400 });
    }
    if (body.scope === 'guild') {
      await services.permissions.setGuildRolePermission({ id: guildId }, body.roleId, body.commandId, body.allowed);
    } else {
      await services.permissions.setChannelRolePermission(
        channelRef(guildId, resolved),
        body.roleId,
        body.commandId,
        body.allowed
      );
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: 'Failed to update permissions' }, { status: 500 });
  }
}
