import { NextResponse } from 'next/server';

import { requireSession } from '@/lib/auth/apiAuth';
import { getDatabase } from '@/lib/db';
import { filterManageableGuilds, type OAuthGuild } from '@/lib/guild/oauth';

export const GET = async () => {
  try {
    const session = await requireSession();
    const rawGuilds =
      (session as { guilds?: Array<{ id: string; name: string; permissions: string; icon?: string | null }> })
        .guilds ?? [];
    const manageable = filterManageableGuilds(
      rawGuilds.map((guild) => ({
        id: guild.id,
        name: guild.name,
        permissions: guild.permissions,
        icon: guild.icon ?? null,
      })) satisfies OAuthGuild[]
    );
    if (!manageable.length) {
      return NextResponse.json({ guilds: [] });
    }

    const db = await getDatabase();
    const summary = await db.notificationIssues.summarizeForGuilds(manageable.map((guild) => guild.id));
    const byId = new Map(summary.map((row) => [row.guildId, row.count]));
    const guilds = manageable
      .filter((guild) => (byId.get(guild.id) ?? 0) > 0)
      .map((guild) => ({
        guildId: guild.id,
        name: guild.name,
        count: byId.get(guild.id) ?? 0,
      }));

    return NextResponse.json({ guilds });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error('[genesis-web] Failed to load issues summary:', error);
    return NextResponse.json({ error: 'Failed to load issues summary' }, { status: 500 });
  }
};
