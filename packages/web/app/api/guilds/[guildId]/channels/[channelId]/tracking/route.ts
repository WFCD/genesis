import { NextResponse } from 'next/server';

import { channelRef, threadRef, type GuildChannelRouteContext } from '@/lib/channels/route';
import { resolveChannelRoute } from '@/lib/channels/route.server';
import { requireGuildAccess } from '@/lib/auth/apiAuth';

export const GET = async (_request: Request, { params }: GuildChannelRouteContext) => {
  try {
    const { guildId, channelId: routeId } = await params;
    const resolved = await resolveChannelRoute(routeId, guildId);
    if (!resolved) return NextResponse.json({ error: 'Channel not found' }, { status: 404 });

    const { services } = await requireGuildAccess(guildId, 'tracking', resolved.parentChannelId);
    const tracking = await services.tracking.getTracking(channelRef(guildId, resolved), threadRef(resolved));
    return NextResponse.json(tracking);
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: 'Failed to load tracking' }, { status: 500 });
  }
};

export const PATCH = async (request: Request, { params }: GuildChannelRouteContext) => {
  try {
    const { guildId, channelId: routeId } = await params;
    const resolved = await resolveChannelRoute(routeId, guildId);
    if (!resolved) return NextResponse.json({ error: 'Channel not found' }, { status: 404 });

    const { services } = await requireGuildAccess(guildId, 'tracking', resolved.parentChannelId);
    const body = (await request.json()) as { items?: string[]; events?: string[]; replace?: boolean };
    await services.tracking.setTracking(guildId, channelRef(guildId, resolved), threadRef(resolved), body);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: 'Failed to update tracking' }, { status: 500 });
  }
};

export const DELETE = async (_request: Request, { params }: GuildChannelRouteContext) => {
  try {
    const { guildId, channelId: routeId } = await params;
    const resolved = await resolveChannelRoute(routeId, guildId);
    if (!resolved) return NextResponse.json({ error: 'Channel not found' }, { status: 404 });

    const { services } = await requireGuildAccess(guildId, 'tracking', resolved.parentChannelId);
    await services.tracking.setTracking(guildId, channelRef(guildId, resolved), threadRef(resolved), {
      items: [],
      events: [],
      replace: true,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: 'Failed to clear tracking' }, { status: 500 });
  }
};
