'use client';

import type { FC } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Avatar, Button, Tooltip, cn } from '@heroui/react';

import { guildIconUrl, guildInitials, type GuildWithBotStatus } from '@/lib/guild/oauth';

import SidebarFooter from './SidebarFooter';

function HomeIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-current">
      <path d="M12 3.172 3 10v9a1 1 0 0 0 1 1h5v-6h6v6h5a1 1 0 0 0 1-1v-9l-9-6.828ZM12 1.5 21.75 9v10.5a2.25 2.25 0 0 1-2.25 2.25h-5.25a.75.75 0 0 1-.75-.75v-6.75h-3v6.75a.75.75 0 0 1-.75.75H4.5A2.25 2.25 0 0 1 2.25 19.5V9L12 1.5Z" />
    </svg>
  );
}

function OwnerIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-current">
      <path d="M12 1 3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4Zm0 2.18 7 3.11v5.71c0 4.52-3.07 8.78-7 9.93-3.93-1.15-7-5.41-7-9.93V6.29l7-3.11ZM11 7v2H9v2h2v2h2v-2h2V9h-2V7h-2Z" />
    </svg>
  );
}

type Props = {
  guilds: GuildWithBotStatus[];
  userName?: string | null;
  isOwner?: boolean;
};

const GuildSidebar: FC<Props> = ({ guilds, userName, isOwner }) => {
  const pathname = usePathname();
  const activeGuildId = pathname.match(/^\/guilds\/(\d+)/)?.[1];
  const homeActive = pathname === '/';
  const suActive = pathname === '/su';

  return (
    <aside className="flex h-full w-[72px] shrink-0 flex-col bg-[#1e1f22]">
      <div className="flex flex-1 flex-col items-center gap-2 overflow-y-auto py-3">
        <Tooltip>
          <Tooltip.Trigger>
            <Link href="/" aria-label="Home">
              <Button
                isIconOnly
                className={cn(
                  'h-12 w-12 rounded-[24px] bg-[#313338] text-white transition-all duration-200 hover:rounded-[16px] hover:bg-[#5865f2]',
                  homeActive && 'rounded-[16px] bg-[#5865f2]'
                )}
                variant="ghost"
              >
                <HomeIcon />
              </Button>
            </Link>
          </Tooltip.Trigger>
          <Tooltip.Content>Home</Tooltip.Content>
        </Tooltip>

        {isOwner ? (
          <Tooltip>
            <Tooltip.Trigger>
              <Link href="/su" aria-label="Owner tools">
                <Button
                  isIconOnly
                  className={cn(
                    'h-12 w-12 rounded-[24px] bg-[#313338] text-[#faa61a] transition-all duration-200 hover:rounded-[16px] hover:bg-[#faa61a] hover:text-[#1e1f22]',
                    suActive && 'rounded-[16px] bg-[#faa61a] text-[#1e1f22]'
                  )}
                  variant="ghost"
                >
                  <OwnerIcon />
                </Button>
              </Link>
            </Tooltip.Trigger>
            <Tooltip.Content>Owner tools (/su)</Tooltip.Content>
          </Tooltip>
        ) : null}

        <div aria-hidden="true" className="my-1 h-0.5 w-8 rounded-full bg-[#35373c]" />

        {guilds.map((guild) => {
          const icon = guildIconUrl(guild);
          const isActive = activeGuildId === guild.id && guild.botPresent;
          const iconShell = (
            <div
              className={cn(
                'relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-[24px] transition-all duration-200',
                guild.botPresent
                  ? 'cursor-pointer hover:rounded-[16px] hover:bg-[#5865f2]'
                  : 'cursor-not-allowed opacity-35 grayscale',
                isActive && 'rounded-[16px] bg-[#5865f2]'
              )}
            >
              <Avatar className="h-12 w-12 rounded-[inherit]">
                {icon ? <Avatar.Image src={icon} alt="" className="rounded-[inherit]" /> : null}
                <Avatar.Fallback className="rounded-[inherit] bg-[#5865f2] text-sm font-semibold text-white">
                  {guildInitials(guild.name)}
                </Avatar.Fallback>
              </Avatar>
            </div>
          );

          if (!guild.botPresent) {
            return (
              <Tooltip key={guild.id}>
                <Tooltip.Trigger>{iconShell}</Tooltip.Trigger>
                <Tooltip.Content>{guild.name} — Genesis has no data for this server</Tooltip.Content>
              </Tooltip>
            );
          }

          return (
            <Tooltip key={guild.id}>
              <Tooltip.Trigger>
                <Link href={`/guilds/${guild.id}`} aria-label={guild.name}>
                  {iconShell}
                </Link>
              </Tooltip.Trigger>
              <Tooltip.Content>{guild.name}</Tooltip.Content>
            </Tooltip>
          );
        })}
      </div>
      <div className="flex shrink-0 justify-center pb-3 pt-2">
        <SidebarFooter userName={userName} />
      </div>
    </aside>
  );
};

export default GuildSidebar;
