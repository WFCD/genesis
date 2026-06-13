import { NextResponse } from 'next/server';

import { requireGuildAccess, requireSession } from '@/lib/auth/apiAuth';

export async function GET(_request: Request, { params }: { params: Promise<{ guildId: string }> }) {
  try {
    const { guildId } = await params;
    const { services } = await requireGuildAccess(guildId, 'custom_commands');
    const commands = await services.customCommands.list(guildId);
    return NextResponse.json({ commands });
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: 'Failed to load custom commands' }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ guildId: string }> }) {
  try {
    const { guildId } = await params;
    const session = await requireSession();
    const { services } = await requireGuildAccess(guildId, 'custom_commands');
    const body = (await request.json()) as { call?: string; response?: string; ephemeral?: boolean };
    if (!body.call || !body.response) {
      return NextResponse.json({ error: 'call and response required' }, { status: 400 });
    }
    await services.customCommands.add(
      { id: guildId },
      body.call,
      body.response,
      session.user.id!,
      Boolean(body.ephemeral)
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: 'Failed to add custom command' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ guildId: string }> }) {
  try {
    const { guildId } = await params;
    const { services } = await requireGuildAccess(guildId, 'custom_commands');
    const body = (await request.json()) as { call?: string };
    if (!body.call) return NextResponse.json({ error: 'call required' }, { status: 400 });
    await services.customCommands.remove({ id: guildId }, body.call);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: 'Failed to delete custom command' }, { status: 500 });
  }
}
