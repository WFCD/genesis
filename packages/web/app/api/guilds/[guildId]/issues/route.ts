import { NextResponse } from 'next/server';

import { requireGuildAccess } from '@/lib/auth/apiAuth';
import { getDatabase } from '@/lib/db';

export const GET = async (_request: Request, { params }: { params: Promise<{ guildId: string }> }) => {
  try {
    const { guildId } = await params;
    await requireGuildAccess(guildId, 'general');
    const db = await getDatabase();
    const issues = await db.notificationIssues.listForGuild(guildId);
    const totalCount = issues.reduce((sum, issue) => sum + issue.count, 0);
    return NextResponse.json({
      issues: issues.map((issue) => ({
        id: issue.id,
        guildId: issue.guildId,
        channelId: issue.channelId,
        threadId: issue.threadId,
        code: issue.code,
        message: issue.message,
        count: issue.count,
        firstSeenAt: issue.firstSeenAt,
        lastSeenAt: issue.lastSeenAt,
      })),
      totalCount,
    });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error('[genesis-web] Failed to load notification issues:', error);
    return NextResponse.json({ error: 'Failed to load issues' }, { status: 500 });
  }
};
