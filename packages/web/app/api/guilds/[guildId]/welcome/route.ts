import { NextResponse } from 'next/server';

import { requireGuildAccess } from '@/lib/auth/apiAuth';

export async function GET(_request: Request, { params }: { params: Promise<{ guildId: string }> }) {
  try {
    const { guildId } = await params;
    const { services } = await requireGuildAccess(guildId, 'welcome');
    const welcomes = await services.welcome.list({ id: guildId });
    return NextResponse.json({
      welcomes: welcomes.map((entry) => ({
        isDm: entry.isDm,
        message: entry.message,
        channelId: entry.channel?.id ?? null,
      })),
    });
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: 'Failed to load welcome messages' }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ guildId: string }> }) {
  try {
    const { guildId } = await params;
    const { services } = await requireGuildAccess(guildId, 'welcome');
    const body = (await request.json()) as { channelId?: string; isDm?: boolean; message?: string };
    if (!body.message) return NextResponse.json({ error: 'message required' }, { status: 400 });
    if (!body.isDm && !body.channelId) {
      return NextResponse.json({ error: 'channelId required for channel welcome' }, { status: 400 });
    }
    await services.welcome.set(
      {
        guild: { id: guildId },
        channel: { id: body.channelId ?? guildId, guild: { id: guildId } },
      },
      Boolean(body.isDm),
      body.message
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: 'Failed to save welcome message' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ guildId: string }> }) {
  try {
    const { guildId } = await params;
    const { services } = await requireGuildAccess(guildId, 'welcome');
    const body = (await request.json()) as { isDm?: boolean };
    await services.welcome.clear({ id: guildId }, Boolean(body.isDm));
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: 'Failed to clear welcome message' }, { status: 500 });
  }
}
