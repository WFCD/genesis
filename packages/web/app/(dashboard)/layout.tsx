import type { ReactNode } from 'react';

import { auth } from '@/auth';
import AppShell from '@/components/AppShell';
import { checkBotInGuilds } from '@/lib/discord';
import { filterManageableGuilds, type OAuthGuild } from '@/lib/guild/oauth';
import { isBotOwner } from '@/lib/auth/ownerAuth';

type Props = {
  children: ReactNode;
};

const DashboardLayout = async ({ children }: Props) => {
  const session = await auth();
  if (!session?.user) return children;

  const rawGuilds =
    (session as { guilds?: Array<{ id: string; name: string; permissions: string; icon?: string | null }> }).guilds ??
    [];
  const manageable = filterManageableGuilds(
    rawGuilds.map((guild) => ({
      id: guild.id,
      name: guild.name,
      permissions: guild.permissions,
      icon: guild.icon ?? null,
    })) satisfies OAuthGuild[]
  );

  const botStatus = await checkBotInGuilds(manageable.map((guild) => guild.id));
  const guilds = manageable.map((guild) => ({
    ...guild,
    botPresent: botStatus[guild.id] ?? false,
  }));

  const owner = isBotOwner(session.user.id);

  return (
    <AppShell guilds={guilds} userName={session.user.name} isOwner={owner}>
      {children}
    </AppShell>
  );
};

export default DashboardLayout;
