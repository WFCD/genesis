'use client';

import type { FC } from 'react';
import { Card } from '@heroui/react';

import HomeBanner from './HomeBanner';
import HomeGuides from './HomeGuides';
import SiteFooter from './SiteFooter';

type Props = {
  appName: string;
  manageableCount: number;
};

const HomeSignedIn: FC<Props> = ({ appName, manageableCount }) => (
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
        <Card.Content className="text-sm text-[#b5bac1]">
          You have Manage Server on {manageableCount} guild(s). Only servers with {appName} show as active icons.
        </Card.Content>
      </Card>

      <HomeGuides />
    </div>

    <SiteFooter />
  </main>
);

export default HomeSignedIn;
