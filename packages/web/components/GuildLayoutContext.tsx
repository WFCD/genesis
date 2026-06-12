'use client';

import { createContext, useContext, type FC, type ReactNode } from 'react';

import type { ChannelTree } from '@/lib/channels/tree';

type GuildLayoutContextValue = {
  guildId: string;
  guildName: string;
  tree: ChannelTree;
  roles: Array<{ id: string; name: string }>;
  channelError?: string | null;
};

const GuildLayoutContext = createContext<GuildLayoutContextValue | null>(null);

export function useGuildLayout() {
  const value = useContext(GuildLayoutContext);
  if (!value) throw new Error('useGuildLayout must be used within GuildLayout');
  return value;
}

type Props = GuildLayoutContextValue & {
  children: ReactNode;
};

const GuildLayoutProvider: FC<Props> = ({ guildId, guildName, tree, roles, channelError, children }) => (
  <GuildLayoutContext.Provider value={{ guildId, guildName, tree, roles, channelError }}>
    {children}
  </GuildLayoutContext.Provider>
);

export default GuildLayoutProvider;
