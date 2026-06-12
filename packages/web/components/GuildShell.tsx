import type { FC, ReactNode } from 'react';

import type { ChannelTree } from '@/lib/channels/tree';

import GuildBannerBackdrop from './GuildBannerBackdrop';
import GuildChannelSidebar from './GuildChannelSidebar';
import GuildLayoutProvider from './GuildLayoutContext';

type Props = {
  guildId: string;
  guildName: string;
  tree: ChannelTree;
  roles: Array<{ id: string; name: string }>;
  channelError?: string | null;
  bannerUrl?: string | null;
  children: ReactNode;
};

const GuildShell: FC<Props> = ({ guildId, guildName, tree, roles, channelError, bannerUrl, children }) => (
  <GuildLayoutProvider guildId={guildId} guildName={guildName} tree={tree} roles={roles} channelError={channelError}>
    <div className="flex min-h-0 flex-1">
      <GuildChannelSidebar guildId={guildId} guildName={guildName} tree={tree} error={channelError} />
      <div className="relative min-h-0 min-w-0 flex-1 overflow-y-auto bg-[#313338]">
        {bannerUrl ? <GuildBannerBackdrop bannerUrl={bannerUrl} /> : null}
        <div className="relative z-10">{children}</div>
      </div>
    </div>
  </GuildLayoutProvider>
);

export default GuildShell;
