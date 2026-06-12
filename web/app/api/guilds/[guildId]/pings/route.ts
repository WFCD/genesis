import { NextResponse } from 'next/server';

import { requireGuildAccess } from '@/lib/auth/apiAuth';
import { parsePingTargetBody } from '@/lib/settings/pingTargets';

export async function GET(_request: Request, { params }: { params: Promise<{ guildId: string }> }) {
  try {
    const { guildId } = await params;
    const { services } = await requireGuildAccess(guildId, 'pings');
    const pings = await services.pings.listPings({ id: guildId });
    return NextResponse.json({ pings });
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: 'Failed to load pings' }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ guildId: string }> }) {
  try {
    const { guildId } = await params;
    const { services } = await requireGuildAccess(guildId, 'pings');
    const body = (await request.json()) as { targets?: unknown; target?: unknown; text?: string };
    const targets = parsePingTargetBody(body);
    if (!targets) {
      return NextResponse.json({ error: 'At least one ping target is required' }, { status: 400 });
    }

    const text = typeof body.text === 'string' ? body.text : '';
    await services.pings.addPings(guildId, { id: guildId }, targets, text);
    const pings = await services.pings.listPings({ id: guildId });
    return NextResponse.json({ ok: true, pings });
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: 'Failed to add ping' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ guildId: string }> }) {
  try {
    const { guildId } = await params;
    const { services } = await requireGuildAccess(guildId, 'pings');
    const body = (await request.json().catch(() => ({}))) as { target?: string; clearAll?: boolean };
    if (body.clearAll) {
      await services.pings.clearPings(guildId);
    } else if (body.target) {
      await services.pings.removePing(guildId, { id: guildId }, body.target);
    } else {
      return NextResponse.json({ error: 'target or clearAll required' }, { status: 400 });
    }
    const pings = await services.pings.listPings({ id: guildId });
    return NextResponse.json({ ok: true, pings });
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: 'Failed to update pings' }, { status: 500 });
  }
}
