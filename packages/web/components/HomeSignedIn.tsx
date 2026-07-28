'use client';

import { useEffect, useState, type FC } from 'react';
import Link from 'next/link';
import { Card, Chip } from '@heroui/react';

import { readJsonResponse } from '@/lib/api/client';

import HomeBanner from './HomeBanner';
import HomeGuides from './HomeGuides';
import SiteFooter from './SiteFooter';

type Props = {
  appName: string;
  manageableCount: number;
};

type IssueGuildChip = {
  guildId: string;
  name: string;
  count: number;
};

const WarningIcon = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current">
    <path d="M12 2 1 21h22L12 2Zm0 4.5 7.5 13h-15L12 6.5ZM11 10v4h2v-4h-2Zm0 6v2h2v-2h-2Z" />
  </svg>
);

const HomeSignedIn: FC<Props> = ({ appName, manageableCount }) => {
  const [issueGuilds, setIssueGuilds] = useState<IssueGuildChip[]>([]);

  useEffect(() => {
    void (async () => {
      const res = await fetch('/api/guilds/issues-summary');
      if (!res.ok) return;
      const data = await readJsonResponse<{ guilds?: IssueGuildChip[] }>(res);
      setIssueGuilds(Array.isArray(data.guilds) ? data.guilds : []);
    })();
  }, []);

  return (
    <main className="flex flex-1 flex-col">
      <HomeBanner className="-mt-px" />

      <div className="flex flex-col gap-6 p-6">
        <div>
          <h1 className="text-2xl font-semibold text-white">{appName} Dashboard</h1>
          <p className="mt-1 text-sm text-[#b5bac1]">
            Pick a server from the left. Gray icons mean {appName} is not installed.
          </p>
        </div>

        <Card className="max-w-xl border border-white/10 bg-[#2b2d31] p-5">
          <Card.Header>
            <Card.Title className="text-white">Select a server</Card.Title>
            <Card.Description className="text-[#b5bac1]">
              Click a server icon in the sidebar to manage channel settings.
            </Card.Description>
          </Card.Header>
          <Card.Content className="space-y-3 text-sm text-[#b5bac1]">
            <p>
              You have Manage Server on {manageableCount} guild(s). Only servers with {appName} show as active icons.
            </p>
            {issueGuilds.length ? (
              <div className="flex flex-wrap gap-2">
                {issueGuilds.map((guild) => (
                  <Link key={guild.guildId} href={`/guilds/${guild.guildId}?tab=issues`}>
                    <Chip size="sm" className="cursor-pointer border border-red-500/40 bg-red-500/15 text-red-300">
                      <span className="inline-flex items-center gap-1.5">
                        <WarningIcon />
                        <span>{guild.name}</span>
                        <span className="tabular-nums opacity-80">({guild.count})</span>
                      </span>
                    </Chip>
                  </Link>
                ))}
              </div>
            ) : null}
          </Card.Content>
        </Card>

        <HomeGuides />
      </div>

      <SiteFooter />
    </main>
  );
};

export default HomeSignedIn;
