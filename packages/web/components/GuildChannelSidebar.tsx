'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useState, type FC } from 'react';
import { cn } from '@heroui/react';

import type { ChannelTree, GuildChannelNode } from '@/lib/channels/tree';
import { findThreadParentId } from '@/lib/channels/tree';

function ChevronIcon({ collapsed }: { collapsed: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={cn('h-3 w-3 shrink-0 fill-current transition-transform duration-200', collapsed ? '' : 'rotate-90')}
    >
      <path d="M9.3 8.3a1 1 0 0 1 1.4 0l4.6 4.6a1 1 0 0 1 0 1.4l-4.6 4.6a1 1 0 0 1-1.4-1.4L13.4 13 9.3 8.9a1 1 0 0 1 0-1.4Z" />
    </svg>
  );
}

function ChannelIcon({ type }: { type: number }) {
  if (type === 5) {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 shrink-0 fill-current opacity-70">
        <path d="M12 2a1 1 0 0 1 .832.445l9 13A1 1 0 0 1 21 17H3a1 1 0 0 1-.832-1.555l9-13A1 1 0 0 1 12 2Zm0 5.874L5.485 15h13.03L12 7.874ZM11 19h2v2h-2v-2Z" />
      </svg>
    );
  }

  return <span className="w-4 shrink-0 text-center text-lg leading-none opacity-70">#</span>;
}

function ThreadIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0 fill-current opacity-70">
      <path d="M7.5 3A4.5 4.5 0 0 0 3 7.5v6A4.5 4.5 0 0 0 7.5 18h1.086l2.35 2.35a1 1 0 0 0 1.664-.29L13.414 18H16.5A4.5 4.5 0 0 0 21 13.5v-6A4.5 4.5 0 0 0 16.5 3h-9Zm0 2h9A2.5 2.5 0 0 1 19 7.5v6a2.5 2.5 0 0 1-2.5 2.5h-3.086a1 1 0 0 0-.664.29l-.764 1.145-.764-1.145A1 1 0 0 0 10.586 16H7.5A2.5 2.5 0 0 1 5 13.5v-6A2.5 2.5 0 0 1 7.5 5Z" />
    </svg>
  );
}

function ChannelLink({
  guildId,
  channel,
  active,
  className,
}: {
  guildId: string;
  channel: GuildChannelNode;
  active: boolean;
  className?: string;
}) {
  return (
    <Link
      href={`/guilds/${guildId}/channels/${channel.id}`}
      className={cn(
        'group flex min-w-0 flex-1 items-center gap-1.5 rounded px-2 py-1.5 text-[15px] text-[#949ba4] hover:bg-[#35373c] hover:text-[#dbdee1]',
        active && 'bg-[#404249] text-white',
        className
      )}
    >
      <ChannelIcon type={channel.type} />
      <span className="truncate">{channel.name}</span>
    </Link>
  );
}

function ThreadLink({ guildId, thread, active }: { guildId: string; thread: GuildChannelNode; active: boolean }) {
  return (
    <Link
      href={`/guilds/${guildId}/channels/${thread.id}`}
      className={cn(
        'group flex items-center gap-1.5 rounded py-1 pl-9 pr-2 text-[14px] text-[#949ba4] hover:bg-[#35373c] hover:text-[#dbdee1]',
        active && 'bg-[#404249] text-white'
      )}
    >
      <ThreadIcon />
      <span className="truncate">{thread.name}</span>
    </Link>
  );
}

function ChannelRow({
  guildId,
  channel,
  activeChannelId,
  collapsedChannels,
  onToggleChannel,
}: {
  guildId: string;
  channel: GuildChannelNode;
  activeChannelId?: string;
  collapsedChannels: Record<string, boolean>;
  onToggleChannel: (channelId: string) => void;
}) {
  const hasThreads = channel.threads.length > 0;
  const channelActive = activeChannelId === channel.id;
  const activeThread = channel.threads.some((thread) => thread.id === activeChannelId);
  const threadsCollapsed = collapsedChannels[channel.id] ?? false;

  return (
    <div>
      <div className="flex items-center">
        {hasThreads ? (
          <button
            type="button"
            aria-label={threadsCollapsed ? `Expand threads in ${channel.name}` : `Collapse threads in ${channel.name}`}
            onClick={() => onToggleChannel(channel.id)}
            className="mr-0.5 rounded p-0.5 text-[#949ba4] hover:text-[#dbdee1]"
          >
            <ChevronIcon collapsed={threadsCollapsed} />
          </button>
        ) : (
          <span className="w-4 shrink-0" />
        )}
        <ChannelLink guildId={guildId} channel={channel} active={channelActive && !activeThread} />
      </div>
      {hasThreads && !threadsCollapsed ? (
        <div className="space-y-0.5">
          {channel.threads.map((thread) => (
            <ThreadLink key={thread.id} guildId={guildId} thread={thread} active={activeChannelId === thread.id} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

type Props = {
  guildId: string;
  guildName: string;
  tree: ChannelTree;
  error?: string | null;
};

const GuildChannelSidebar: FC<Props> = ({ guildId, guildName, tree, error }) => {
  const pathname = usePathname();
  const activeChannelId = pathname.match(/^\/guilds\/[^/]+\/channels\/(\d+)/)?.[1];
  const overviewActive = pathname === `/guilds/${guildId}`;
  const categoryStorageKey = `genesis:collapsed-categories:${guildId}`;
  const channelStorageKey = `genesis:collapsed-channel-threads:${guildId}`;

  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});
  const [collapsedChannels, setCollapsedChannels] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      const storedCategories = localStorage.getItem(categoryStorageKey);
      if (storedCategories) setCollapsedCategories(JSON.parse(storedCategories) as Record<string, boolean>);
      const storedChannels = localStorage.getItem(channelStorageKey);
      if (storedChannels) setCollapsedChannels(JSON.parse(storedChannels) as Record<string, boolean>);
    } catch {
      /* ignore */
    }
  }, [categoryStorageKey, channelStorageKey]);

  useEffect(() => {
    if (!activeChannelId) return;
    const parentId = findThreadParentId(tree, activeChannelId);
    if (!parentId) return;
    setCollapsedChannels((prev) => (prev[parentId] ? { ...prev, [parentId]: false } : prev));
  }, [activeChannelId, tree]);

  const toggleCategory = useCallback(
    (categoryId: string) => {
      setCollapsedCategories((prev) => {
        const next = { ...prev, [categoryId]: !prev[categoryId] };
        try {
          localStorage.setItem(categoryStorageKey, JSON.stringify(next));
        } catch {
          /* ignore */
        }
        return next;
      });
    },
    [categoryStorageKey]
  );

  const toggleChannelThreads = useCallback(
    (channelId: string) => {
      setCollapsedChannels((prev) => {
        const next = { ...prev, [channelId]: !prev[channelId] };
        try {
          localStorage.setItem(channelStorageKey, JSON.stringify(next));
        } catch {
          /* ignore */
        }
        return next;
      });
    },
    [channelStorageKey]
  );

  const renderChannels = (channels: GuildChannelNode[]) =>
    channels.map((channel) => (
      <ChannelRow
        key={channel.id}
        guildId={guildId}
        channel={channel}
        activeChannelId={activeChannelId}
        collapsedChannels={collapsedChannels}
        onToggleChannel={toggleChannelThreads}
      />
    ));

  return (
    <nav className="flex w-60 shrink-0 flex-col bg-[#2b2d31]">
      <div className="flex h-12 shrink-0 items-center border-b border-black/20 px-4 shadow-sm">
        <h2 className="truncate text-[15px] font-semibold text-white">{guildName}</h2>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
        <Link
          href={`/guilds/${guildId}`}
          className={cn(
            'mb-1 flex items-center gap-2 rounded px-2 py-1.5 text-[15px] hover:bg-[#35373c]',
            overviewActive ? 'bg-[#404249] text-white' : 'text-[#dbdee1]'
          )}
        >
          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#5865f2] text-[10px] font-bold text-white">
            G
          </span>
          <span>Server Settings</span>
        </Link>

        {error ? <p className="px-2 py-3 text-xs text-danger">{error}</p> : null}

        {tree.categories.map((category) => {
          const isCollapsed = collapsedCategories[category.id] ?? false;
          return (
            <div key={category.id} className="mt-3">
              <button
                type="button"
                onClick={() => toggleCategory(category.id)}
                className="flex w-full items-center gap-0.5 rounded px-1 py-1 text-left text-xs font-semibold uppercase tracking-wide text-[#949ba4] hover:text-[#dbdee1]"
              >
                <ChevronIcon collapsed={isCollapsed} />
                <span className="truncate">{category.name}</span>
              </button>
              {!isCollapsed ? <div className="mt-0.5 space-y-0.5">{renderChannels(category.channels)}</div> : null}
            </div>
          );
        })}

        {tree.uncategorized.length ? (
          <div className="mt-3">
            {tree.categories.length ? (
              <p className="px-1 py-1 text-xs font-semibold uppercase tracking-wide text-[#949ba4]">Channels</p>
            ) : null}
            <div className="mt-0.5 space-y-0.5">{renderChannels(tree.uncategorized)}</div>
          </div>
        ) : null}

        {!error && !tree.categories.length && !tree.uncategorized.length ? (
          <p className="px-2 py-3 text-xs text-[#949ba4]">No text channels found.</p>
        ) : null}
      </div>
    </nav>
  );
};

export default GuildChannelSidebar;
