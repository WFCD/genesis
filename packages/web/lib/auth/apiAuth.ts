import 'server-only';

import { auth } from '@/auth';
import type { AuthzAction } from '#shared/services/AuthzService';
import { fetchGuildMemberRoles, isBotInGuild } from '@/lib/discord';
import { getServices } from '@/lib/db';

export async function requireSession() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Response('Unauthorized', { status: 401 });
  }
  return session;
}

export async function requireGuildAccess(guildId: string, action: AuthzAction, channelId?: string) {
  const session = await requireSession();
  const botPresent = await isBotInGuild(guildId);
  if (!botPresent) {
    throw new Response('Genesis has no data for this guild', { status: 404 });
  }

  const memberRoles = await fetchGuildMemberRoles(guildId, session.user.id!);
  const services = await getServices();
  const allowed = await services.authz.canManage(
    {
      id: session.user.id!,
      guilds: (session as { guilds?: Array<{ id: string; permissions?: string }> }).guilds,
      memberRoles,
    },
    guildId,
    action,
    channelId ? { id: channelId } : undefined
  );

  if (!allowed) {
    throw Response.json(
      {
        error: services.authz.hasManageGuild(
          {
            id: session.user.id!,
            guilds: (session as { guilds?: Array<{ id: string; permissions?: string }> }).guilds,
          },
          guildId
        )
          ? 'Missing elevated role for this action'
          : 'Manage Server or an elevated role is required',
      },
      { status: 403 }
    );
  }

  return { session, services, memberRoles };
}
