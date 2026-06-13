import { NextResponse } from 'next/server';

import { requireGuildAccess } from '@/lib/auth/apiAuth';

const TOP_COMMAND_LIMIT = 10;

export async function GET(_request: Request, { params }: { params: Promise<{ guildId: string }> }) {
  try {
    const { guildId } = await params;
    const { services } = await requireGuildAccess(guildId, 'statistics');
    const commands = (await services.statistics.getGuildCommandStats({ id: guildId }, TOP_COMMAND_LIMIT)) as Array<{
      id: string;
      count: number;
    }>;
    return NextResponse.json({ commands });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error('[genesis-web] Failed to load command stats:', error);
    return NextResponse.json({ error: 'Failed to load command stats' }, { status: 500 });
  }
}
