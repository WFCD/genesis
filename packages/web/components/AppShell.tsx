import type { FC, ReactNode } from 'react';

import type { GuildWithBotStatus } from '@/lib/guild/oauth';

import GuildSidebar from './GuildSidebar';

type Props = {
  guilds: GuildWithBotStatus[];
  userName?: string | null;
  isOwner?: boolean;
  children: ReactNode;
};

const AppShell: FC<Props> = ({ guilds, userName, isOwner, children }) => (
  <div className="flex h-dvh max-h-dvh overflow-hidden bg-[#313338] text-[#dbdee1]">
    <GuildSidebar guilds={guilds} userName={userName} isOwner={isOwner} />
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto overscroll-y-contain">{children}</div>
  </div>
);

export default AppShell;
