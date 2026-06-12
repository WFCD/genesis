import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';

import { auth } from '@/auth';
import GuildShell from '@/components/GuildShell';
import { buildChannelTree } from '@/lib/channels/tree';
import { fetchDiscordGuildBanner, fetchGuildChannelNodes, fetchGuildRoles } from '@/lib/discord';

type Props = {
  children: ReactNode;
  params: Promise<{ guildId: string }>;
};

const GuildLayout = async ({ children, params }: Props) => {
  const { guildId } = await params;
  const session = await auth();

  if (!session?.user) {
    redirect('/');
  }

  let channelError: string | null = null;
  let tree = buildChannelTree([]);
  let roles: Array<{ id: string; name: string }> = [];

  try {
    const [nodes, guildRoles] = await Promise.all([
      fetchGuildChannelNodes(guildId),
      fetchGuildRoles(guildId).catch(() => [] as Array<{ id: string; name: string }>),
    ]);
    tree = buildChannelTree(nodes);
    roles = guildRoles;
  } catch {
    channelError = 'Could not load channels. Check BOT_TOKEN in web/.env.local.';
  }

  const guildName =
    (session as { guilds?: Array<{ id: string; name: string }> }).guilds?.find((guild) => guild.id === guildId)?.name ??
    guildId;

  const bannerUrl = await fetchDiscordGuildBanner(guildId);

  return (
    <GuildShell
      guildId={guildId}
      guildName={guildName}
      tree={tree}
      roles={roles}
      channelError={channelError}
      bannerUrl={bannerUrl}
    >
      {children}
    </GuildShell>
  );
};

export default GuildLayout;
