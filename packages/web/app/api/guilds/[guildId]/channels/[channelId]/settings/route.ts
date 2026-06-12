import { NextResponse } from 'next/server';

import { channelRef, rejectThreadRoutes } from '@/lib/channels/route';
import { resolveChannelRoute } from '@/lib/channels/route.server';
import { requireGuildAccess } from '@/lib/auth/apiAuth';
import { LFG_SETTING_KEYS } from '@/lib/settings/lfg';

const GENERAL_KEYS = [
  'language',
  'platform',
  'modRole',
  'ephemerate',
  'allowCustom',
  'allowInline',
  'settings.cc.ping',
  'deleteExpired',
];

const SETTING_KEYS = [...GENERAL_KEYS, ...LFG_SETTING_KEYS];

export async function GET(_request: Request, { params }: { params: Promise<{ guildId: string; channelId: string }> }) {
  try {
    const { guildId, channelId: routeId } = await params;
    const resolved = await resolveChannelRoute(routeId, guildId);
    if (!resolved) return NextResponse.json({ error: 'Channel not found' }, { status: 404 });
    rejectThreadRoutes(resolved);

    const { services } = await requireGuildAccess(guildId, 'general', resolved.parentChannelId);
    const channel = channelRef(guildId, resolved);
    const settings = await services.channels.getChannelSettings(channel, SETTING_KEYS, { id: guildId });
    return NextResponse.json({ settings });
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: 'Failed to load settings' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ guildId: string; channelId: string }> }) {
  try {
    const { guildId, channelId: routeId } = await params;
    const resolved = await resolveChannelRoute(routeId, guildId);
    if (!resolved) return NextResponse.json({ error: 'Channel not found' }, { status: 404 });
    rejectThreadRoutes(resolved);

    const { services } = await requireGuildAccess(guildId, 'general', resolved.parentChannelId);
    const body = (await request.json()) as Record<string, string | boolean | null>;
    const channel = channelRef(guildId, resolved);
    await services.channels.patchChannelSettings(channel, { id: guildId }, body);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
